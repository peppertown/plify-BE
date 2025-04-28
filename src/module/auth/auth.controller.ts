import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify/code')
  async spotifyLogin(@Body('code') code: string) {
    return await this.authService.handleSpotifyCallback(code);
  }
}
