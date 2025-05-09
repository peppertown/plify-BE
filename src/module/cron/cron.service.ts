import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { subMonths, subYears } from 'date-fns';

@Injectable()
export class CronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldRankingData() {
    const now = new Date();

    const shortTermCutoff = subMonths(now, 1); // 1개월
    const mediumTermCutoff = subMonths(now, 3); // 3개월
    const longTermCutoff = subYears(now, 6); // 6개월

    await this.prisma.$transaction([
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
    ]);

    console.log('✅ 오래된 랭킹 데이터 삭제 완료');
  }
}
