import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AuthGuard } from '@nestjs/passport';
import {
  getFollowingPlaylistDocs,
  getWeeklyPlaylistDocs,
} from './docs/home.docs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  // 이번주의 플레이리스트 조회
  @Get('playlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getWeeklyPlaylistDocs.operation
  @getWeeklyPlaylistDocs.response
  async getWeeklyPlaylist(@CurrentUserId() userId: number) {
    return await this.homeService.getWeeklyPlaylist(userId);
  }

  @Get('playlist/following')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getFollowingPlaylistDocs.operation
  @getFollowingPlaylistDocs.response
  async getFollowingPlaylist(@CurrentUserId() userId: number) {
    return await this.homeService.getFollowingPlaylist(userId);
  }
}
