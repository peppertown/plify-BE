import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(userId: number, postId: number, content: string) {
    try {
      const newComment = await this.prisma.comment.create({
        data: {
          userId,
          postId,
          content,
        },
      });

      return {
        message: {
          code: 200,
          text: '댓글이 등록되었습니다.',
        },
        comment: {
          commentId: newComment.id,
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        '댓글 등록 중 오류가 발생했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
