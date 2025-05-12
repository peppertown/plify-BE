import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserFollow(userId: number, targetUserId: number) {
    try {
      const existing = await this.prisma.userFollow.findFirst({
        where: { followeeId: userId, followerId: targetUserId },
      });

      if (existing) {
        await this.prisma.userFollow.delete({
          where: { id: existing.id },
        });
      } else {
        await this.prisma.userFollow.create({
          data: { followeeId: userId, followerId: targetUserId },
        });
      }

      return {
        message: {
          code: 200,
          text: existing
            ? '팔로잉이 취소되었습니다.'
            : '팔로우가 완료됐습니다.',
        },
      };
    } catch (err) {
      console.error('팔로잉 토글 중 에러 발생', err);
      throw new HttpException(
        '팔로잉 토글 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFollowers(userId: number) {
    try {
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
    } catch (err) {
      console.error('팔로워 목록 조회 중 에러 발생', err);
      throw new HttpException(
        '팔로워 목록 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFollowings(userId: number) {
    try {
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
    } catch (err) {
      console.error('팔로잉 목록 조회 중 에러 발생', err);
      throw new HttpException(
        '팔로잉 목록 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFollower(userId: number, targetUserId: number) {
    try {
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
    } catch (err) {
      console.error('팔로워 목록 제거 중 에러 발생', err);
      throw new HttpException(
        '팔로워 목록 제거 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  formatUserList(result: any) {
    return { id: result.id, name: result.name, profileUrl: result.profile_url };
  }
}
