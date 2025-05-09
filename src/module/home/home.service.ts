import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { endOfWeek, startOfWeek } from 'date-fns';
import { PlaylistService } from '../playlist/playlist.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistService,
  ) {}

  // 이번주 좋아요 가장 많이 받은 플레이리스트 조회
  async getWeeklyPlaylist(userId: number) {
    try {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 0 });
      const end = endOfWeek(now, { weekStartsOn: 0 });

      const result = await this.prisma.playlist.findMany({
        where: { createdAt: { gte: start, lte: end } },

        orderBy: {
          PlaylistLike: {
            _count: 'desc',
          },
        },

        take: 5,

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
        message: {
          code: 200,
          text: '이번주 플레이리스트 조회에 성공했습니다',
        },
        playlist,
      };
    } catch (err) {
      console.error('이번주 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '이번주의 플레이리스트 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 팔로우한 유저들의 최신 플레이리스트 조회
  async getFollowingPlaylist(userId: number) {
    try {
      const result = await this.prisma.userFollow.findMany({
        where: { followeeId: userId },
        select: { followerId: true },
      });

      const followingIds = result.map((res) => res.followerId);

      const playlistData = await this.prisma.playlist.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { id: 'desc' },
        take: 10,
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

      const playlist = playlistData.map((res) =>
        this.playlistService.getPlaylistObj(res),
      );

      return {
        message: {
          code: 200,
          text: '팔로우한 유저들의 플레이리스트 조회가 완료되었습니다.',
        },
        playlist,
      };
    } catch (err) {
      console.error('팔로잉 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '팔로우한 유저들의 플레이리스트 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
