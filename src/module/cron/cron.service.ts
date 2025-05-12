import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { subMonths, subYears } from 'date-fns';

@Injectable()
export class CronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDailyTasks() {
    const now = new Date();

    // 랭킹 데이터 커트라인
    const shortTermCutoff = subMonths(now, 1); // 1개월
    const mediumTermCutoff = subMonths(now, 3); // 3개월
    const longTermCutoff = subYears(now, 6); // 6개월

    // 비활성 유저 커트라인
    const userInactiveCutoff = subMonths(now, 6); // 6개월

    try {
      const deleteResults = await this.prisma.$transaction([
        // 랭킹: Top Track
        this.prisma.userTopTrack.deleteMany({
          where: {
            timeRange: 'short_term',
            snapshotAt: { lt: shortTermCutoff },
          },
        }),
        this.prisma.userTopTrack.deleteMany({
          where: {
            timeRange: 'medium_term',
            snapshotAt: { lt: mediumTermCutoff },
          },
        }),
        this.prisma.userTopTrack.deleteMany({
          where: {
            timeRange: 'long_term',
            snapshotAt: { lt: longTermCutoff },
          },
        }),

        // 랭킹: Top Artist
        this.prisma.userTopArtist.deleteMany({
          where: {
            timeRange: 'short_term',
            snapshotAt: { lt: shortTermCutoff },
          },
        }),
        this.prisma.userTopArtist.deleteMany({
          where: {
            timeRange: 'medium_term',
            snapshotAt: { lt: mediumTermCutoff },
          },
        }),
        this.prisma.userTopArtist.deleteMany({
          where: {
            timeRange: 'long_term',
            snapshotAt: { lt: longTermCutoff },
          },
        }),

        // 랭킹: Top Genre
        this.prisma.userTopGenre.deleteMany({
          where: {
            timeRange: 'short_term',
            snapshotAt: { lt: shortTermCutoff },
          },
        }),
        this.prisma.userTopGenre.deleteMany({
          where: {
            timeRange: 'medium_term',
            snapshotAt: { lt: mediumTermCutoff },
          },
        }),
        this.prisma.userTopGenre.deleteMany({
          where: {
            timeRange: 'long_term',
            snapshotAt: { lt: longTermCutoff },
          },
        }),

        // 비활성 유저 삭제
        this.prisma.user.deleteMany({
          where: {
            lastLoginedAt: {
              lt: userInactiveCutoff,
              not: null,
            },
          },
        }),
      ]);

      const [
        ttShort,
        ttMedium,
        ttLong,
        taShort,
        taMedium,
        taLong,
        tgShort,
        tgMedium,
        tgLong,
        deletedUsers,
      ] = deleteResults;

      console.log('✅ 랭킹 삭제 완료:');
      console.log(
        `- TopTrack: ${ttShort.count} (1M), ${ttMedium.count} (3M), ${ttLong.count} (6Y)`,
      );
      console.log(
        `- TopArtist: ${taShort.count} (1M), ${taMedium.count} (3M), ${taLong.count} (6Y)`,
      );
      console.log(
        `- TopGenre: ${tgShort.count} (1M), ${tgMedium.count} (3M), ${tgLong.count} (6Y)`,
      );

      console.log(`✅ 비활성 유저 삭제 완료: ${deletedUsers.count}명`);
    } catch (err) {
      console.error('❌ 정기 클린업 작업 중 에러 발생', err);
    }
  }
}
