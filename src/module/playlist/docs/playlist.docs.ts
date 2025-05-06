import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const getAllPlaylistsDocs = {
  operation: ApiOperation({
    summary: '전체 플레이리스트 조회',
    description: '등록된 전체 플레이리스트 목록을 조회합니다.',
  }),

  response: ApiResponse({
    status: 200,
    description: '전체 플레이리스트 조회 성공',
    schema: {
      example: {
        playlists: [
          {
            userId: '유저 아이디',
            userName: '유저 이름',
            userNickname: '유저 닉네임',
            userProfileUrl: '유저 프로필 사진 url',
            postId: '아이디',
            playlistId: '플레이 리스트 아이디',
            likeCount: '좋아요 수',
            commentCount: '댓글 수',
            genre: ['장르 아이디 1', '장르 아이디2'],
            isLiked: '좋아요 여부',
            viewCount: '조회수',
            createdAt: '생성 일자',
          },
        ],
        message: {
          code: 200,
          text: '전체 플레이리스트를 정상적으로 조회했습니다.',
        },
      },
    },
  }),
};

export const addPlaylistDocs = {
  operation: ApiOperation({
    summary: '플레이리스트 추가 API',
    description: '사용자가 플레이리스트 URL을 업로드합니다.',
  }),

  body1: ApiBody({
    description: '추가할 플레이리스트 URL',
    schema: {
      type: 'object',
      properties: {
        playlistUrl: {
          type: 'string',
          example: '추가할 플레이리스트 URL',
        },
      },
    },
  }),

  body2: ApiBody({
    description: '플레이리스트 설명',
    schema: {
      type: 'object',
      properties: {
        explanation: {
          type: 'string',
          example: '플레이리스트 설명',
        },
      },
    },
  }),

  body3: ApiBody({
    description: '장르 id 배열',
    schema: {
      type: 'object',
      properties: {
        genres: {
          type: 'number[]',
          example: '장르 id 배열',
        },
      },
    },
  }),

  response: ApiResponse({
    status: 201,
    description: '플레이리스트가 성공적으로 생성되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200 },
            text: { type: 'string', example: '플레이리스트가 생성되었습니다.' },
          },
        },
        playlists: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 2 },
          },
        },
      },
    },
  }),
};

export const getPlaylistDocs = {
  operation: ApiOperation({
    summary: '개별 플레이리스트 조회',
    description: 'postId를 통해 해당 플레이리스트의 댓글 목록을 가져옵니다.',
  }),

  param: ApiParam({
    name: 'postId',
    type: Number,
    required: true,
    description: '조회할 플레이리스트의 고유 ID',
  }),

  response: ApiResponse({
    status: 200,
    description: '플레이리스트의 댓글 정보를 반환합니다.',
    schema: {
      example: {
        explanation: '플레이리스트 설명',
        comment: [
          {
            commentId: '댓글 아이디',
            postId: '포스트 아이디',
            userId: '유저 아이디',
            userName: '유저 이름',
            userNickname: '유저 닉네임',
            userProfileUrl: '유저 프로필 url',
            content: '댓글 내용',
            createdAt: '작성 일자',
            likeCount: '좋아요 수',
            isLiked: '좋아요 여부',
          },
        ],
        commentCount: '댓글 개수',
        message: {
          code: 200,
          text: '개별 플레이리스트를 정상적으로 조회했습니다.',
        },
      },
    },
  }),
};

export const deletePlaylistDocs = {
  operation: ApiOperation({
    summary: '플레이리스트 삭제',
    description: '플레이리스트를 삭제합니다.',
  }),
  param: ApiParam({
    name: 'postId',
    description: '삭제할 플레이리스트 ID',
    example: 1,
  }),
  response: ApiResponse({
    status: 200,
    description: '삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '플레이리스트가 삭제되었습니다.',
        },
      },
    },
  }),
};

export const togglePlaylistLikeDocs = {
  operation: ApiOperation({ summary: '플레이리스트 좋아요 토글' }),
  param: ApiParam({
    name: 'postId',
    required: true,
    description: '플레이리스트 ID',
  }),
  response: ApiResponse({
    description: '좋아요 상태가 변경되었습니다.',
    schema: {
      example: {
        message: {
          code: 200,
          text: '플레이리스트 좋아요가 추가됐습니다. / 플레이리스트 좋아요가 취소되었습니다',
        },
      },
    },
  }),
};
