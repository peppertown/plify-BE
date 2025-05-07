import { Module } from '@nestjs/common';
import { MypageService } from './mypage.service';
import { MypageController } from './mypage.controller';
import { PlaylistModule } from '../playlist/playlist.module';

@Module({
  imports: [PlaylistModule],
  controllers: [MypageController],
  providers: [MypageService],
})
export class MypageModule {}
