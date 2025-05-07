import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export const getMyPlaylistDocs = {
  operation: ApiOperation({
    summary: '마이페이지 플레이리스트 조회 API',
    description:
      '내가 만든 플레이리스트 또는 내가 좋아요한 플레이리스트를 조회합니다. \n\n' +
      '`mine=true`이면 내가 만든 플레이리스트, `mine=false`이면 좋아요한 플레이리스트입니다.',
  }),

  query: ApiQuery({
    name: 'mine',
    required: true,
    type: Boolean,
    description: '내가 만든 플레이리스트인지 여부',
    example: true,
  }),

  response: ApiResponse({
    status: 200,
    description: '마이페이지 플레이리스트 조회 성공',
    schema: {
      example: {
        playlist: [
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
          message: '마이페이지 플레이리스트 조회에 성공했습니다.',
        },
      },
    },
  }),
};
