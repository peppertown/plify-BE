import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
