import { Module } from '@nestjs/common';
import { MypageService } from './mypage.service';
import { MypageController } from './mypage.controller';

@Module({
  controllers: [MypageController],
  providers: [MypageService],
})
export class MypageModule {}
