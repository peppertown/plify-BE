import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
  togglePlaylistLikeDocs,
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
    @Body()
    body: { playlistUrl: string; explanation: string; genres: number[] },
  ) {
    return await this.playlistService.addPlaylist(
      userId,
      body.playlistUrl,
      body.explanation,
      body.genres,
    );
  }

  // 장르 데이터 조회
  @Get('genres')
  async getGenres() {
    return await this.playlistService.getAllGenres();
  }

  // 장르별 플레이리스트 조회
  @Get('genre')
  @UseGuards(AuthGuard('jwt'))
  async getGenrePlaylists(
    @CurrentUserId() userId: number,
    @Query('genreId', ParseIntPipe) genreId: number,
  ) {
    return await this.playlistService.getGenrePlaylists(userId, genreId);
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

  // 플레이리스트 좋아요 토글
  @Post(':postId/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @togglePlaylistLikeDocs.operation
  @togglePlaylistLikeDocs.param
  @togglePlaylistLikeDocs.response
  async togglePlaylistLike(
    @CurrentUserId() userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.playlistService.togglePlaylistLike(userId, postId);
  }
}
