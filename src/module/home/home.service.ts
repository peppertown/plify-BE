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

      return { playlist };
    } catch (err) {
      console.error('이번주 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '이번주의 플레이리스트 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
