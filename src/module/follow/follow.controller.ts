import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import {
  deleteFollowerDocs,
  getFollowersDocs,
  getFollowingsDocs,
  handleUserFollowDocs,
} from './docs/follow.docs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('follow')
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':targetUserId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @handleUserFollowDocs.operation
  @handleUserFollowDocs.param
  @handleUserFollowDocs.response
  async handleUserFollow(
    @CurrentUserId() userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.followService.handleUserFollow(userId, targetUserId);
  }

  @Get('follower')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getFollowersDocs.operation
  @getFollowersDocs.response
  async getFollowers(@CurrentUserId() userId: number) {
    return await this.followService.getFollowers(userId);
  }

  @Get('following')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @getFollowingsDocs.operation
  @getFollowingsDocs.response
  async getFollowings(@CurrentUserId() userId: number) {
    return await this.followService.getFollowings(userId);
  }

  @Delete(':targetUserId')
  @UseGuards(AuthGuard('jwt'))
  @deleteFollowerDocs.operation
  @deleteFollowerDocs.param
  @deleteFollowerDocs.response
  async deleteFollower(
    @CurrentUserId() userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return await this.followService.deleteFollower(userId, targetUserId);
  }
}
