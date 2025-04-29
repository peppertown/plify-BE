import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  // 전체 플레이리스트 조회
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

  // 플레이리스트 댓글 조회 == 플레이리스트 개별 조회
  async getPlaylist(postId: number, userId: number) {
    try {
      // 조회수 증가
      await this.prisma.playlist.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });

      const result = await this.prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              name: true,
              nickname: true,
              profile_url: true,
            },
          },
          _count: {
            select: { likes: true }, // 좋아요 수
          },
          likes: {
            where: { userId }, // 유저 좋아요 여부
            select: { id: true },
          },
        },
      });

      const comment = result.map((res) => this.getCommentObj(res));

      return {
        comment,
        message: {
          code: 200,
          text: '개별 플레이리스트를 정상적으로 조회했습니다.',
        },
      };
    } catch (err) {
      console.error(err);
      if (err.code === 'P2025') {
        throw new HttpException(
          '플레이리스트를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 추가
  async addPlaylist(userId: number, playlistUrl: string) {
    const playlistId = this.extractPlaylistId(playlistUrl);

    const newPlaylist = await this.prisma.playlist.create({
      data: {
        userId,
        playlistId,
      },
    });

    return {
      message: {
        code: 200,
        text: '플레이리스트가 생성되었습니다.',
      },
      playlists: {
        id: newPlaylist.id,
      },
    };
  }

  // 플레이리스트 id 추출
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

  // 응답데이터 포맷
  getPlaylistObj(result: any) {
    return {
      userId: result.user.id,
      userName: result.user.name,
      userNickname: result.user.nickname,
      userProfileUrl: result.user.profile_url,
      postId: result.id,
      playlistId: result.playlistId,
      likeCount: result._count.likes,
      isLiked: !!result.PlaylistLike[0],
      viewCount: result.viewCount,
      createdAt: result.createdAt,
    };
  }

  // 댓글 응답데이터 포맷
  getCommentObj(res: any) {
    return {
      commentId: res.id,
      postId: res.postId,
      userId: res.userId,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      content: res.content,
      createdAt: res.createdAt,
      likeCount: res._count.likes,
      isLiked: !!res.likes[0],
    };
  }
}
