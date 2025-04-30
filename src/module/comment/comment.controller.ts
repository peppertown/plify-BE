import {
  Controller,
  Body,
  Post,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentService } from './comment.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { createCommentDocs } from './docs/comment.docs';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 댓글 작성
  @Post(':postId')
  @UseGuards(AuthGuard('jwt'))
  @createCommentDocs.operation
  @createCommentDocs.body
  @createCommentDocs.response
  async createComment(
    @CurrentUserId() userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: { content: string },
  ) {
    return await this.commentService.createComment(
      userId,
      postId,
      body.content,
    );
  }
}
