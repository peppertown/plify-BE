import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { PlaylistModule } from '../playlist/playlist.module';

@Module({
  imports: [PlaylistModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
