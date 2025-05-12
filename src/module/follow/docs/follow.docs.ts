import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const handleUserFollowDocs = {
  operation: ApiOperation({
    summary: '팔로우/언팔로우 토글 API',
    description:
      '특정 유저를 팔로우하거나, 이미 팔로우한 경우 팔로잉을 취소합니다.',
  }),

  param: ApiParam({
    name: 'targetUserId',
    required: true,
    description: '팔로우하거나 언팔할 유저의 ID',
    example: 5,
  }),

  response: ApiResponse({
    status: 200,
    description: '팔로우/언팔로우 결과 메시지 반환',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로우가 완료됐습니다. | 팔로잉이 취소되었습니다.',
        },
      },
    },
  }),
};

export const getFollowersDocs = {
  operation: ApiOperation({
    summary: '팔로워 목록 조회 API',
    description: '내 계정을 팔로우하고 있는 유저들의 목록을 조회합니다.',
  }),

  response: ApiResponse({
    status: 200,
    description: '팔로워 목록 반환',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로워 목록 조회에 성공했습니다',
        },
        follower: [
          {
            id: '팔로워 아이디 | number',
            name: '팔로워 이름 | string',
            profileUrl: '팔로워 프로필 url | string',
          },
        ],
      },
    },
  }),
};

export const getFollowingsDocs = {
  operation: ApiOperation({
    summary: '팔로잉 목록 조회 API',
    description: '유저가 팔로잉하고 있는 유저들의 목록을 조회합니다.',
  }),

  response: ApiResponse({
    status: 200,
    description: '팔로잉 목록 반환',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로잉 목록 조회에 성공했습니다',
        },
        follower: [
          {
            id: '팔로잉 유저 아이디 | number',
            name: '팔로잉 유저 이름 | string',
            profileUrl: '팔로잉 유저 프로필 url | string',
          },
        ],
      },
    },
  }),
};

export const deleteFollowerDocs = {
  operation: ApiOperation({
    summary: '팔로워 제거 API',
    description: '나를 팔로우하고 있는 유저를 팔로워 목록에서 제거합니다.',
  }),

  param: ApiParam({
    name: 'targetUserId',
    required: true,
    description: '팔로워 목록에서 제거할 유저 ID',
    example: 42,
  }),

  response: ApiResponse({
    status: 200,
    description: '팔로워 제거 성공 시 반환 메시지',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로워 제거에 성공했습니다.',
        },
      },
    },
  }),
};
