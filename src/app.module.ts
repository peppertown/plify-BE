import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PlaylistModule } from './module/playlist/playlist.module';
import { CommentModule } from './module/comment/comment.module';
import { RankModule } from './module/rank/rank.module';
import { MypageModule } from './module/mypage/mypage.module';
import { HomeModule } from './module/home/home.module';
import { FollowModule } from './module/follow/follow.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RedisModule,
    PlaylistModule,
    CommentModule,
    RankModule,
    MypageModule,
    HomeModule,
    FollowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
