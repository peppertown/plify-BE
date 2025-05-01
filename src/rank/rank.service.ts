import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserTopTracks(spotifyAccessToken: string, userId: number) {
    const previousRank = await this.prisma.userTopTrack.findMany({
      where: { userId },
      orderBy: { rank: 'desc' },
    });
    const lastSnapshot = previousRank[0]?.snapshotAt;
    if (!lastSnapshot) {
      const currentRank = await this.fetchSpotifyTopTracks(spotifyAccessToken);
      await this.saveUserTopTrack(currentRank, userId);
    }
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
