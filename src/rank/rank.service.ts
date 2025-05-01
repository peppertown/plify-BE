import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserTopTracks(
    spotifyAccessToken: string,
    userId: number,
    range: string,
  ) {
    // timeRange 설정
    const timeRange = this.getTimeRange(range);

    // DB에서 유저의 랭킹(탑트랙) 조회
    const previousRank = await this.prisma.userTopTrack.findMany({
      where: { userId, timeRange },
      orderBy: { rank: 'asc' },
    });

    // 랭킹 조회 시점 확인
    const lastSnapshot = previousRank[0]?.snapshotAt;

    // 랭킹 조회 시점 없을 시 (랭킹 첫 확인일 시) 예외처리
    if (!lastSnapshot) {
      const currentRank = await this.fetchSpotifyTopTracks(
        spotifyAccessToken,
        timeRange,
      );
      await this.saveUserTopTrack(currentRank, userId, timeRange);

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
      const currentRank = await this.fetchSpotifyTopTracks(
        spotifyAccessToken,
        timeRange,
      );
      await this.prisma.userTopTrack.deleteMany({
        where: { userId, timeRange },
      });
      await this.saveUserTopTrack(currentRank, userId, timeRange);

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

  async handleUserTopArtists(
    spotifyAccessToken: string,
    userId: number,
    range: string,
  ) {
    // timeRange 설정
    const timeRange = this.getTimeRange(range);

    // DB에서 유저의 탑 아티스트 조회
    const previousRank = await this.prisma.userTopArtist.findMany({
      where: { userId, timeRange },
      orderBy: { rank: 'asc' },
    });

    // 랭킹 조회 시점 확인
    const lastSnapshot = previousRank[0]?.snapshotAt;

    if (!lastSnapshot) {
      const currentRank = await this.fetchSpotifyTopArtists(
        spotifyAccessToken,
        timeRange,
      );
    }
  }

  getTimeRange(range: string) {
    const timeRangeMap = {
      short: 'short_term',
      medium: 'medium_term',
      long: 'long_term',
    } as const;

    const timeRange = timeRangeMap[range as keyof typeof timeRangeMap];

    if (!timeRange) {
      throw new Error(
        '잘못된 range 값입니다. short, medium, long 중 하나여야 합니다.',
      );
    }

    return timeRange;
  }

  // 유저 탑 트랙 조회 (스포티파이)
  async fetchSpotifyTopTracks(userAccessToken: string, term: string) {
    const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${term}&limit=50`;

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

  async fetchSpotifyTopArtists(userAccessToken: string, term: string) {
    const url = `https://api.spotify.com/v1/me/top/artists?&limit=50&time_range=${term}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    const data = response.data.items.map((item, i) => ({
      rank: i + 1,
      artistId: item.id,
      artistName: item.name,
      imageUrl: item.images[0]?.url,
      externalUrl: item.external_urls.spotify,
    }));

    return { data };
  }

  // 유저 탑 트랙 DB에 저장
  async saveUserTopTrack(result: any, userId: number, timeRange: string) {
    const data = result.map((res) => ({
      ...res,
      userId,
      timeRange,
    }));
    await this.prisma.userTopTrack.createMany({ data });
  }
}
