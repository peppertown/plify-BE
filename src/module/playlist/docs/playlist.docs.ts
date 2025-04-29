import { ApiOperation, ApiResponse } from '@nestjs/swagger';

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
