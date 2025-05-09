import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaylistService } from '../playlist/playlist.service';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class MypageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistService,
    private readonly followService: FollowService,
  ) {}

  // 유저가 만든 플레이리스트 조회
  async getMyPlaylist(userId: number, mine: boolean) {
    try {
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
          text: '마이페이지 플레이리스트 조회에 성공했습니다.',
        },
      };
    } catch (err) {
      console.error('마이페이지 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '마이페이지 플레이리스트 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 유저가 작성한 댓글 조회
  async getMyComment(userId: number) {
    try {
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
        message: { code: 200, text: '작성한 댓글 조회에 성공했습니다.' },
      };
    } catch (err) {
      console.error('마이페이지 댓글 조회 중 에러 발생', err);
      throw new HttpException(
        '마이페이지 댓글 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 다른 유저의 마이페이지 조회
  async getUserMyPage(userId: number, targetUserId: number) {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, profile_url: true },
      });

      const user = {
        id: userData.id,
        name: userData.name,
        profileUrl: userData.profile_url,
      };
      const playlistData = (await this.getMyPlaylist(targetUserId, true))
        .playlist;
      const followerData = await this.followService.getFollowers(targetUserId);
      const followerCount = followerData.follower.length;
      const isFollowed = !!followerData.follower.filter(
        (res) => userId == res.id,
      ).length;
      const followingCount = (
        await this.followService.getFollowings(targetUserId)
      ).following.length;

      return {
        message: {
          code: 200,
          text: '다른 유저 마이페이지 조회에 성공했습니다',
        },
        user,
        playlistData,
        followerCount,
        followingCount,
        isFollowed,
        playlistCount: playlistData.length,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      console.error('다른 유저 마이페이지 조회 중 에러 발생', err);
      throw new HttpException(
        '다른 유저 마이페이지 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
