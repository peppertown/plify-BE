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
import { getMyPlaylistDocs } from './docs/mypage.docs';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('mypage')
export class MypageController {
  constructor(private readonly mypageService: MypageService) {}

  @Get('playlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getMyPlaylistDocs.operation
  @getMyPlaylistDocs.query
  @getMyPlaylistDocs.response
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
