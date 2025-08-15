import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

// 플레이리스트 id 추출
export function extractPlaylistId(url: string): string {
  const regex = /playlist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  throw new HttpException(
    '유효하지 않은 플레이리스트 주소입니다.',
    HttpStatus.BAD_REQUEST,
  );
}

// 플레이리스트 패칭
export async function fetchPlaylist(
  playlistId: string,
  userAccessToken: string,
  spotifyPlaylistUrl: string,
) {
  try {
    const url = `${spotifyPlaylistUrl}/${playlistId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    const data = response.data;
    return {
      imageUrl: data.images[0].url,
      name: data.name,
      userName: data.owner.display_name,
      externalUrl: data.external_urls.spotify,
    };
  } catch (err) {
    console.error('플레이리스트 페칭 중 에러 발생', err);
    throw new HttpException(
      '플레이리스트 페칭 중 오류가 발생했습니다.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// 플레이리스트 아이템(트랙 정보) 패칭
export async function fetchPlaylistItems(
  playlistId: string,
  userAccessToken: string,
  spotifyPlaylistUrl: string,
) {
  try {
    const url = `${spotifyPlaylistUrl}/${playlistId}/tracks`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    return response.data.items.map((i) => ({
      trackId: i.track.id,
      title: i.track.name,
      artistName: i.track.artists.map((a) => a.name).join(', '),
      artistExternalUrl: i.track.artists[0].external_urls.spotify,
      imageUrl: i.track.album.images?.[0]?.url,
      externalUrl: i.track.external_urls.spotify,
      durationMs: i.track.duration_ms,
    }));
  } catch (err) {
    console.error('플레이리스트 아이템 페칭 중 에러 발생', err);
    throw new HttpException(
      '플레이리스트 아이템 페칭 중 오류가 발생했습니다.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
