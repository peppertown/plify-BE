import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { endOfWeek, startOfWeek } from 'date-fns';
import { PlaylistService } from '../playlist/playlist.service';
import { playlistBaseInclude } from '../playlist/helpers/playlist.query.option';
import { formatPlaylist } from 'src/utils/formatter';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistService,
  ) {}

  // 이번주 좋아요 가장 많이 받은 플레이리스트 조회
  async getWeeklyPlaylist(userId: number) {
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

      include: playlistBaseInclude(userId),
    });

    const playlist = result.map((res) => formatPlaylist(res));

    return {
      message: {
        code: 200,
        text: '이번주 플레이리스트 조회에 성공했습니다',
      },
      playlist,
    };
  }

  // 팔로우한 유저들의 최신 플레이리스트 조회
  async getFollowingPlaylist(userId: number) {
    const result = await this.prisma.userFollow.findMany({
      where: { followeeId: userId },
      select: { followerId: true },
    });

    const followingIds = result.map((res) => res.followerId);

    const playlistData = await this.prisma.playlist.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { id: 'desc' },
      take: 10,
      include: playlistBaseInclude(userId),
    });

    const playlist = playlistData.map((res) => formatPlaylist(res));

    return {
      message: {
        code: 200,
        text: '팔로우한 유저들의 플레이리스트 조회가 완료되었습니다.',
      },
      playlist,
    };
  }
}
