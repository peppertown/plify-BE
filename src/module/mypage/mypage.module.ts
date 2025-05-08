import { Module } from '@nestjs/common';
import { MypageService } from './mypage.service';
import { MypageController } from './mypage.controller';
import { PlaylistModule } from '../playlist/playlist.module';
import { FollowModule } from '../follow/follow.module';

@Module({
  imports: [PlaylistModule, FollowModule],
  controllers: [MypageController],
  providers: [MypageService],
})
export class MypageModule {}
