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
