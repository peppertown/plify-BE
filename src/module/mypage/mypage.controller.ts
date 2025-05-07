import {
  Controller,
  Get,
  ParseBoolPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MypageService } from './mypage.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('mypage')
export class MypageController {
  constructor(private readonly mypageService: MypageService) {}

  @Get('playlist')
  @UseGuards(AuthGuard('jwt'))
  async getMyPlaylist(
    @CurrentUserId() userId: number,
    @Query('mine', ParseBoolPipe) mine: boolean,
  ) {
    return await this.mypageService.getMyPlaylist(userId, mine);
  }

  @Get('comment')
  @UseGuards(AuthGuard('jwt'))
  async getMyComment(@CurrentUserId() userId: number) {
    return await this.mypageService.getMyComment(userId);
  }
}
