import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const getWeeklyPlaylistDocs = {
  operation: ApiOperation({
    summary: '이번주 플레이리스트 조회 API',
    description: '이번주 등록된 인기 플레이리스트 5개를 조회합니다.',
  }),

  response: ApiResponse({
    status: 200,
    description: '이번주 플레이리스트 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '이번주 플레이리스트 조회에 성공했습니다',
        },
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
            genre: ['장르1', '장르2'],
            isLiked: '좋아요 여부',
            viewCount: '조회수',
            createdAt: '생성 일자',
          },
        ],
      },
    },
  }),
};

export const getFollowingPlaylistDocs = {
  operation: ApiOperation({
    summary: '팔로우한 유저들의 플레이리스트 조회 API',
    description:
      '내가 팔로우한 유저들의 최신 플레이리스트를 조회합니다. (최대 10개)',
  }),

  response: ApiResponse({
    status: 200,
    description: '팔로우한 유저들의 플레이리스트 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로우한 유저들의 플레이리스트 조회가 완료되었습니다.',
        },
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
            genre: ['장르1', '장르2'],
            isLiked: '좋아요 여부',
            viewCount: '조회수',
            createdAt: '생성 일자',
          },
        ],
      },
    },
  }),
};
