import { Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';

@Module({
  controllers: [PlaylistController],
  providers: [PlaylistService, JwtStrategy],
})
export class PlaylistModule {}
