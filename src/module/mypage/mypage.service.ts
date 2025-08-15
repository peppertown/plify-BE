import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaylistService } from '../playlist/playlist.service';
import { playlistBaseInclude } from '../playlist/helpers/playlist.query.option';
import { FollowService } from '../follow/follow.service';
import { formatPlaylist } from 'src/utils/formatter';

@Injectable()
export class MypageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistService,
    private readonly followService: FollowService,
  ) {}

  // 유저가 만든 플레이리스트 조회
  async getMyPlaylist(userId: number, mine: boolean) {
    const result = await this.prisma.playlist.findMany({
      where: mine ? { userId } : { PlaylistLike: { some: { userId } } },
      orderBy: { id: 'desc' },
      include: playlistBaseInclude(userId),
    });

    const playlist = result.map((res) => formatPlaylist(res));

    return {
      playlist,
      message: {
        code: 200,
        text: '마이페이지 플레이리스트 조회에 성공했습니다.',
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
      message: { code: 200, text: '작성한 댓글 조회에 성공했습니다.' },
    };
  }

  // 다른 유저의 마이페이지 조회
  async getUserMyPage(userId: number, targetUserId: number) {
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
    const isFollowed = !!followerData.follower.filter((res) => userId == res.id)
      .length;
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
  }
}
