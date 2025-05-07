import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { login, refreshTokenDocs, spotifyLoginDocs } from './docs/auth.docs';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify/code')
  @spotifyLoginDocs.operation
  @spotifyLoginDocs.body
  @spotifyLoginDocs.response
  async spotifyLogin(@Body('code') code: string) {
    return await this.authService.handleSpotifyCallback(code);
  }

  @Post('refresh')
  @refreshTokenDocs.operation
  @refreshTokenDocs.body
  @refreshTokenDocs.response
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.handleRefresh(refreshToken);
  }

  @Post('login')
  @login.body
  async login(@Body('id') id: string) {
    return await this.authService.login(id);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  async deleteUser(@CurrentUserId() userId: number) {
    return await this.authService.deleteUser(userId);
  }
}
