// src/docs/auth.docs.ts

import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export const spotifyLoginDocs = {
  operation: ApiOperation({
    summary: '스포티파이 로그인',
    description: 'Authorization Code를 이용해 Spotify 로그인을 수행합니다.',
  }),
  body: ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Spotify Authorization Code',
          example: 'Authorization Code 문자열',
        },
      },
    },
  }),
  response: ApiResponse({
    status: HttpStatus.OK,
    description: '스포티파이 로그인 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: 200,
              description: '응답 코드 (성공: 200)',
            },
            message: {
              type: 'string',
              example: '스포티파이 로그인 성공',
              description: '응답 메시지',
            },
          },
        },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'number', example: 1, description: '유저 ID' },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: '유저 이메일',
            },
            name: {
              type: 'string',
              example: 'Spotify 표시 이름',
              description: '유저 이름',
            },
            nickname: {
              type: 'string',
              example: 'Spotify 닉네임',
              description: '유저 닉네임',
            },
            profileUrl: {
              type: 'string',
              example: 'https://profile-image-url.com',
              description: '프로필 이미지 URL',
            },
            authProvider: {
              type: 'string',
              example: 'spotify',
              description: '인증 제공자',
            },
            followersCount: { type: 'number', description: '유저 팔로워 수' },
            followingsCount: { type: 'number', description: '유저 팔로잉 수' },
          },
        },
        jwt: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: '서버 발급 JWT Access Token',
              description: '서버가 발급한 Access Token',
            },
            refreshToken: {
              type: 'string',
              example: '서버 발급 JWT Refresh Token',
              description: '서버가 발급한 Refresh Token',
            },
          },
        },
        spotify: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: '스포티파이 OAuth Access Token',
              description: 'Spotify에서 직접 발급한 Access Token',
            },
            refreshToken: {
              type: 'string',
              example: '스포티파이 OAuth Refresh Token',
              description: 'Spotify에서 직접 발급한 Refresh Token',
            },
          },
        },
      },
    },
  }),
};

export const refreshTokenDocs = {
  operation: ApiOperation({
    summary: 'JWT & Spotify 토큰 리프레시',
    description:
      '서버의 JWT refreshToken을 사용하여 새로운 JWT access/refresh 토큰과 Spotify accessToken을 재발급합니다.',
  }),
  body: ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: '서버 발급 JWT refreshToken',
          example: '서버 JWT 리프레시 토큰 문자열',
        },
      },
    },
  }),
  response: ApiResponse({
    status: HttpStatus.OK,
    description: '토큰 재발급 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: 200,
              description: '응답 코드 (성공: 200)',
            },
            message: {
              type: 'string',
              example: '토큰 재발급 성공',
              description: '응답 메시지',
            },
          },
        },
        jwt: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: '새 서버 JWT Access Token',
              description: '서버가 새로 발급한 Access Token',
            },
            refreshToken: {
              type: 'string',
              example: '새 서버 JWT Refresh Token',
              description: '서버가 새로 발급한 Refresh Token',
            },
          },
        },
        spotify: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: '새 스포티파이 Access Token',
              description: '스포티파이에서 새로 발급받은 Access Token',
            },
            refreshToken: {
              type: 'string',
              example: '기존 스포티파이 Refresh Token',
              description: '스포티파이에서 사용 중인 Refresh Token (변경 없음)',
            },
          },
        },
      },
    },
  }),
};

export const login = {
  body: ApiBody({
    description: '테스트용 자체 로그인 로직',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['code'],
    },
  }),
};
