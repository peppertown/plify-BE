import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserFollow(userId: number, targetUserId: number) {
    const existing = await this.prisma.userFollow.findFirst({
      where: { followeeId: targetUserId, followerId: userId },
    });

    if (existing) {
      await this.prisma.userFollow.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.userFollow.create({
        data: { followeeId: targetUserId, followerId: userId },
      });
    }

    const followData = await this.getUsersFollowCount(targetUserId);

    const { followerCount, followingCount } = followData.data;

    return {
      message: {
        code: 200,
        text: existing ? '팔로잉이 취소되었습니다.' : '팔로우가 완료됐습니다.',
      },
      followerCount,
      followingCount,
    };
  }

  async getFollowers(userId: number) {
    const result = await this.prisma.userFollow.findMany({
      where: { followeeId: userId },
      select: { follower: true },
      orderBy: { id: 'desc' },
    });
    let follower = result.map((res) => this.formatUserList(res.follower));

    const myFollowings = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });

    const followingIds = new Set(myFollowings.map((f) => f.followeeId));

    follower = follower.map((res) => ({
      ...res,
      isFollowed: followingIds.has(res.id),
    }));

    return {
      message: {
        code: 200,
        text: '팔로워 목록 조회에 성공했습니다',
      },
      follower,
    };
  }

  async getFollowings(userId: number) {
    const result = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followee: true },
      orderBy: { id: 'desc' },
    });

    const following = await Promise.all(
      result.map(async (res) => {
        const isFollowed = await this.prisma.userFollow.findFirst({
          where: {
            followerId: res.followee.id,
            followeeId: userId,
          },
        });

        return {
          id: res.followee.id,
          name: res.followee.name,
          profileUrl: res.followee.profile_url,
          isFollowed: !!isFollowed,
        };
      }),
    );
    return {
      message: {
        code: 200,
        text: '팔로잉 목록 조회에 성공했습니다',
      },
      following,
    };
  }

  async deleteFollower(userId: number, targetUserId: number) {
    await this.prisma.userFollow.delete({
      where: {
        unique_following: {
          followerId: targetUserId,
          followeeId: userId,
        },
      },
    });

    return {
      message: { code: 200, text: '팔로워 제거에 성공했습니다.' },
    };
  }

  async getUsersFollowCount(userId: number) {
    const [followerCount, followingCount] = await this.prisma.$transaction([
      this.prisma.userFollow.count({ where: { followeeId: userId } }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);

    return {
      message: {
        code: 200,
        text: '팔로우 수 조회에 성공했습니다.',
      },
      data: {
        followerCount,
        followingCount,
      },
    };
  }

  formatUserList(result: any) {
    return { id: result.id, name: result.name, profileUrl: result.profile_url };
  }
}
