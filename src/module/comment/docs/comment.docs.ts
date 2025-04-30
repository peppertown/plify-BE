import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const createCommentDocs = {
  operation: ApiOperation({ summary: '댓글 작성 API' }),
  body: ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: '댓글 내용 입력' },
      },
    },
  }),
  response: ApiResponse({
    status: 200,
    description: '댓글 작성 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            code: { type: 'number', example: 200 },
            text: {
              type: 'string',
              example: '댓글이 정상적으로 등록되었습니다.',
            },
          },
        },
        comment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
          },
        },
      },
    },
  }),
};

export const deleteCommentDocs = {
  operation: ApiOperation({
    summary: '댓글 삭제',
    description: '댓글 ID를 기반으로 댓글을 삭제합니다. JWT 인증 필요.',
  }),
  param: ApiParam({
    name: 'commentId',
    required: true,
    description: '삭제할 댓글의 ID',
  }),
  response: ApiResponse({
    status: 200,
    description: '댓글 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '댓글이 삭제되었습니다.',
        },
      },
    },
  }),
};
