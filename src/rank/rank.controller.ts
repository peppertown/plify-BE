import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { RankService } from './rank.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Get('track')
  @UseGuards(AuthGuard('jwt'))
  async test(
    @CurrentUserId() userId: number,
    @Body() body: { code: string; range: string },
  ) {
    return await this.rankService.handleUserTopTracks(
      body.code,
      userId,
      body.range,
    );
  }
}
