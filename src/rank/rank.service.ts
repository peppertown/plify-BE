import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserTopTracks(spotifyAccessToken: string, userId: number) {
    // DB에서 유저의 랭킹(탑트랙) 조회
    const previousRank = await this.prisma.userTopTrack.findMany({
      where: { userId },
      orderBy: { rank: 'asc' },
    });

    // 랭킹 조회 시점 확인
    const lastSnapshot = previousRank[0]?.snapshotAt;

    // 랭킹 조회 시점 없을 시 (랭킹 첫 확인일 시) 예외처리
    if (!lastSnapshot) {
      const currentRank = await this.fetchSpotifyTopTracks(spotifyAccessToken);
      await this.saveUserTopTrack(currentRank, userId);

      const rank = currentRank.map((data) => ({
        ...data,
        diff: 0, // 첫 랭킹 확인이라 순위 변동 X
      }));

      return {
        message: {
          code: 200,
          text: '랭킹 조회가 완료됐습니다.',
        },
        rank,
      };
    }

    // 랭킹 변동값 측정 주기(하루)가 지났는지 확인
    const now = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const shouldUpdate = now.getTime() - lastSnapshot.getTime() > ONE_DAY;

    // 주기 지났을 시 새로운 데이터 받아오고 기존 데이터 삭제 후 저장
    if (shouldUpdate) {
      const currentRank = await this.fetchSpotifyTopTracks(spotifyAccessToken);
      await this.prisma.userTopTrack.deleteMany({ where: { userId } });
      await this.saveUserTopTrack(currentRank, userId);

      // 랭킹 변동값 측정
      const rank = currentRank.map((curr) => {
        const prev = previousRank.find((p) => p.trackId === curr.trackId);

        const diff = prev ? prev.rank - curr.rank : null;

        return {
          ...curr,
          diff, // 숫자 or null(랭킹 신규 진입)
        };
      });

      return {
        message: {
          code: 200,
          text: '랭킹 조회가 완료됐습니다.',
        },
        rank,
      };
    }

    const rank = previousRank.map((data) => ({
      ...data,
      diff: 0,
    }));

    return {
      message: {
        code: 200,
        text: '랭킹 조회가 완료됐습니다.',
      },
      rank,
    };
  }

  // 유저 탑 트랙 조회 (스포티파이)
  async fetchSpotifyTopTracks(userAccessToken: string) {
    const url = `https://api.spotify.com/v1/me/top/tracks?limit=50`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    const data = response.data.items.map((item, i) => ({
      rank: i + 1,
      trackId: item.id,
      name: item.name,
      imageUrl: item.album.images?.[0]?.url || null,
      artistId: item.artists?.[0]?.id || null,
      artistName: item.artists?.map((a) => a.name).join(', ') || '',
      externalUrl: item.external_urls?.spotify || null,
    }));

    return data;
  }

  // 유저 탑 트랙 DB에 저장
  async saveUserTopTrack(result: any, userId: number) {
    const data = result.map((res) => ({
      ...res,
      userId,
    }));
    await this.prisma.userTopTrack.createMany({ data });
  }
}
