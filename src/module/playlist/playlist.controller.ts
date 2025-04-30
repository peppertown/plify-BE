import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import {
  addPlaylistDocs,
  getAllPlaylistsDocs,
  getPlaylistDocs,
  deletePlaylistDocs,
} from './docs/playlist.docs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('playlist')
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // 전체 플레이리스트 조회
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getAllPlaylistsDocs.operation
  @getAllPlaylistsDocs.response
  async getAllPlaylists(@CurrentUserId() userId: number) {
    return await this.playlistService.getAllPlaylists(userId);
  }

  // 플레이리스트 추가
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @addPlaylistDocs.operation
  @addPlaylistDocs.body
  @addPlaylistDocs.response
  async addPlayList(
    @CurrentUserId() userId: number,
    @Body() body: { playlistUrl: string },
  ) {
    return await this.playlistService.addPlaylist(userId, body.playlistUrl);
  }

  // 개별 플레이리스트 조회
  @Get(':postId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getPlaylistDocs.operation
  @getPlaylistDocs.param
  @getPlaylistDocs.response
  async getPlaylist(
    @CurrentUserId() userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.playlistService.getPlaylist(postId, userId);
  }

  @Delete(':postId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @deletePlaylistDocs.operation
  @deletePlaylistDocs.param
  @deletePlaylistDocs.response
  async deletePlaylist(
    @CurrentUserId() userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.playlistService.deletePlaylist(postId, userId);
  }
}
