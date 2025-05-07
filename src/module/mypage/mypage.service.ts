import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaylistService } from '../playlist/playlist.service';

@Injectable()
export class MypageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistService,
  ) {}

  // 유저가 만든 플레이리스트 조회
  async getMyPlaylist(userId: number, mine: boolean) {
    const result = await this.prisma.playlist.findMany({
      where: mine ? { userId } : { PlaylistLike: { some: { userId } } },
      orderBy: { id: 'desc' },
      include: {
        _count: { select: { PlaylistLike: true, Comment: true } },
        PlaylistGenres: { select: { genre: { select: { name: true } } } },

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

    const playlist = result.map((res) =>
      this.playlistService.getPlaylistObj(res),
    );

    return {
      playlist,
      message: {
        code: 200,
        message: '마이페이지 플레이리스트 조회에 성공했습니다.',
      },
    };
  }

  // 유저가 작성한 댓글 조회
  async getMyComment(userId: number) {
    const result = await this.prisma.comment.findMany({
      where: { userId },
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const comment = result.map((res) => ({
      id: res.id,
      postId: res.postId,
      content: res.content,
      likeCount: res._count.likes,
      createdAt: res.createdAt,
    }));

    return {
      comment,
      message: { code: 200, message: '작성한 댓글 조회에 성공했습니다.' },
    };
  }
}
