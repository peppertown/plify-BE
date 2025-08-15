import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  // 댓글 작성
  async createComment(userId: number, postId: number, content: string) {
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
  }

  // 댓글 삭제
  async deleteComment(userId: number, commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpException('댓글을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
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
  }

  // 댓글 좋아요 토글
  async toggleCommentLike(userId: number, commentId: number) {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      return {
        message: {
          code: 200,
          text: '댓글 좋아요를 취소했습니다.',
        },
      };
    } else {
      await this.prisma.commentLike.create({
        data: {
          userId,
          commentId,
        },
      });

      return {
        message: {
          code: 200,
          text: '댓글에 좋아요를 추가했습니다.',
        },
      };
    }
  }
}
