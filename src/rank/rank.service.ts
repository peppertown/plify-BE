import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RankService {
  // 유저 탑 트랙 조회 (스포티파이)
  async fetchSpotifyTopTracks(userAccessToken: string) {
    const url = `https://api.spotify.com/v1/me/top/tracks`;

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
}
