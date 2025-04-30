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
  async deleteComment(userId: number, commentId: number) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new HttpException(
          '댓글을 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      if (comment.userId !== userId) {
        throw new HttpException('삭제 권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      await this.prisma.comment.delete({
        where: { id: commentId },
      });

      return {
        message: {
          code: 200,
          text: '댓글이 삭제되었습니다.',
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        '댓글 삭제 중 오류가 발생했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
