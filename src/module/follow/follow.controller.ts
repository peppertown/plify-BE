import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':targetUserId')
  @UseGuards(AuthGuard('jwt'))
  async handleUserFollow(
    @CurrentUserId() userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.followService.handleUserFollow(userId, targetUserId);
  }

  @Get('follower')
  @UseGuards(AuthGuard('jwt'))
  async getFollowers(@CurrentUserId() userId: number) {
    return await this.followService.getFollowers(userId);
  }

  @Get('following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowings(@CurrentUserId() userId: number) {
    return await this.followService.getFollowings(userId);
  }
}
