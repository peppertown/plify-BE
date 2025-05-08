import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  // 이번주의 플레이리스트 조회
  @Get('playlist')
  async getWeeklyPlaylist(@CurrentUserId() userId: number) {
    return await this.homeService.getWeeklyPlaylist(userId);
  }
}
