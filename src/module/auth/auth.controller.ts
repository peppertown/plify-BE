import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { spotifyLoginDocs } from './docs/auth.docs';

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
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.handleRefresh(refreshToken);
  }
}
