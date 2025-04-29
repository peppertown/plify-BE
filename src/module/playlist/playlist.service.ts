import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlaylists(userId: number) {
    const result = await this.prisma.playlist.findMany({
      orderBy: { id: 'desc' },
      include: {
        _count: { select: { PlaylistLike: true } },
        PlaylistLike: { where: { userId }, select: { id: true } },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            profile_url: true,
          },
        },
      },
    });

    const playlists = result.map((res) => this.getPlaylistObj(res));

    return {
      playlists,
      message: {
        code: 200,
        text: '전체 플레이리스트를 정상적으로 조회했습니다.',
      },
    };
  }

  extractPlaylistId(url: string): string {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    throw new HttpException(
      'Invalid Spotify playlist URL',
      HttpStatus.BAD_REQUEST,
    );
  }

  getPlaylistObj(result: any) {
    return {
      userId: result.user.id,
      userName: result.user.name,
      userNickname: result.user.nickname,
      userProfileUrl: result.user.profile_url,
      id: result.id,
      playlistId: result.playlistId,
      likeCount: result._count.likes,
      isLiked: !!result.PlaylistLike[0],
      viewCount: result.viewCount,
      createdAt: result.createdAt,
    };
  }
}
