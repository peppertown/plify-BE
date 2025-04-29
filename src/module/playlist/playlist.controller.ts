import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllPlaylists(@CurrentUserId() userId: number) {
    return await this.playlistService.getAllPlaylists(userId);
  }
}
