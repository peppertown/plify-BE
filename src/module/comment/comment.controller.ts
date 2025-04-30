import {
  Controller,
  Body,
  Post,
  UseGuards,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentService } from './comment.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import {
  createCommentDocs,
  deleteCommentDocs,
  toggleCommentLikeDocs,
} from './docs/comment.docs';
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

  // 댓글 삭제
  @Delete(':commentId')
  @UseGuards(AuthGuard('jwt'))
  @deleteCommentDocs.operation
  @deleteCommentDocs.param
  @deleteCommentDocs.response
  async deleteComment(
    @CurrentUserId() userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return await this.commentService.deleteComment(userId, commentId);
  }

  // 댓글 좋아요 토글
  @Post('like/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @toggleCommentLikeDocs.operation
  @toggleCommentLikeDocs.param
  @toggleCommentLikeDocs.response
  async toggleCommentLike(
    @CurrentUserId() userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return await this.commentService.toggleCommentLike(userId, commentId);
  }
}
