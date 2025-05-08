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
}
