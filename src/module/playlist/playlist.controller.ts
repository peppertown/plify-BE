import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { getAllPlaylistsDocs } from './docs/playlist.docs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('playlist')
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getAllPlaylistsDocs.operation
  @getAllPlaylistsDocs.response
  async getAllPlaylists(@CurrentUserId() userId: number) {
    return await this.playlistService.getAllPlaylists(userId);
  }
}
