import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RankService } from './rank.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  getUserTopArtistsDocs,
  getUserTopGenresDocs,
  getUserTopTracksDocs,
} from './docs/rank.docs';

@ApiTags('rank')
@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Post('track')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getUserTopTracksDocs.operation
  @getUserTopTracksDocs.body
  @getUserTopTracksDocs.response
  async getUserTopTracks(
    @CurrentUserId() userId: number,
    @Body() body: { code: string; range: string },
  ) {
    return await this.rankService.handleUserTopTracks(
      body.code,
      userId,
      body.range,
    );
  }

  @Post('artist')
  @UseGuards(AuthGuard('jwt'))
  @getUserTopArtistsDocs.operation
  @getUserTopArtistsDocs.body
  @getUserTopArtistsDocs.response
  async handleUserTopArtists(
    @CurrentUserId() userId: number,
    @Body() body: { code: string; range: string },
  ) {
    return await this.rankService.handleUserTopArtists(
      body.code,
      userId,
      body.range,
    );
  }

  @Get('genre')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getUserTopGenresDocs.operation
  @getUserTopGenresDocs.query
  @getUserTopGenresDocs.response
  async getUserTopGenres(
    @CurrentUserId() userId: number,
    @Query() query: { range: string },
  ) {
    return await this.rankService.getUserTopGenres(userId, query.range);
  }
}
