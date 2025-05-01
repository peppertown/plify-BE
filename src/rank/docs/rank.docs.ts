import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const getUserTopTracksDocs = {
  operation: applyDecorators(
    ApiOperation({ summary: '유저 탑 트랙 랭킹 조회 API' }),
  ),

  body: applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'Spotify 엑세스 토큰' },
          range: {
            type: 'string',
            example: 'short | medium | long',
            description: '랭킹 범위 (short | medium | long)',
          },
        },
        required: ['code', 'range'],
      },
    }),
  ),

  response: applyDecorators(
    ApiResponse({
      status: 200,
      description: '랭킹 조회 성공',
      schema: {
        example: {
          message: {
            code: 200,
            text: '랭킹 조회가 완료됐습니다.',
          },
          rank: [
            {
              id: 'db에 저장된 id',
              userId: '유저 아이디',
              rank: '랭크',
              trackId: '트랙의 스포티파이 아이디',
              name: '트랙 제목',
              imageUrl: '트랙 이미지 url',
              artistId: '아티스트의 스포티파이 아이디',
              artistName: '아티스트 이름',
              externalUrl: '해당 트랙 스포티파이 주소',
              snapshotAt: '랭킹 확인 일자',
              timeRange: 'short_term / midium_term / long_term',
              diff: '순위 변동값 / diff > 0 순위 상승, diff < 0 순위 하락, diff = null 랭킹 신규 진입',
            },
          ],
        },
      },
    }),
  ),
};
