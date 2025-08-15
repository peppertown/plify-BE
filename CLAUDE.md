# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드입니다.

## 프로젝트 개요

FLIP은 NestJS로 구축된 Spotify 플레이리스트 공유 플랫폼입니다. 사용자는 Spotify로 로그인하여 플레이리스트를 공유하고, 새로운 음악을 발견하며, 댓글과 좋아요를 통해 소통할 수 있습니다. 사용자 통계, 랭킹 시스템, 소셜 기능을 포함합니다.

## 개발 명령어

```bash
# 개발
npm run start:dev          # 개발 서버 시작 (watch 모드)
npm run start:debug        # 디버그 모드로 시작

# 빌드
npm run build              # 프로젝트 빌드
npm run start:prod         # 프로덕션 서버 시작

# 코드 품질
npm run lint               # ESLint 실행 (자동 수정)
npm run format             # Prettier로 코드 포맷팅

# 테스트
npm run test               # 유닛 테스트 실행
npm run test:watch         # 테스트 watch 모드
npm run test:cov           # 커버리지와 함께 테스트 실행
npm run test:e2e           # E2E 테스트 실행
```

## 아키텍처 개요

### 핵심 스택
- **프레임워크**: NestJS with TypeScript
- **데이터베이스**: MySQL with Prisma ORM
- **캐싱**: Redis (세션 관리)
- **인증**: Spotify OAuth with JWT
- **문서화**: Swagger/OpenAPI (`/api-docs`)

### 모듈 구조
NestJS 모듈 아키텍처를 따르며 다음 주요 모듈들로 구성:

- **AuthModule**: Spotify OAuth 인증 및 JWT 관리
- **PlaylistModule**: 플레이리스트 CRUD 및 Spotify API 연동
- **CommentModule**: 플레이리스트 댓글 시스템
- **RankModule**: 랭킹 및 통계 기능
- **MypageModule**: 사용자 프로필 및 개인 데이터 관리
- **HomeModule**: 피드 및 탐색 기능
- **FollowModule**: 팔로우/팔로워 시스템
- **CronModule**: 데이터 업데이트 스케줄링 작업

### 주요 서비스
- **PrismaService**: 데이터베이스 연결 및 ORM
- **RedisService**: 캐싱 및 세션 관리
- **SpotifyAPI**: Spotify Web API 연동 유틸리티 함수

### 데이터베이스 스키마
Prisma 스키마 구성:
- Spotify 연동된 사용자 관리
- 메타데이터와 아이템을 포함한 플레이리스트 저장
- 소셜 기능 (댓글, 좋아요, 팔로우)
- 사용자 통계 (시간 범위별 탑 아티스트/트랙/장르)
- 장르 분류 시스템

### Spotify 연동
- Spotify OAuth 인증 플로우
- 플레이리스트 데이터 가져오기 및 동기화
- 사용자 통계 수집 (탑 트랙/아티스트/장르)
- 플레이리스트 공유 및 외부 URL 처리

### 환경 변수
필수 환경 변수:
- `DATABASE_URL`: MySQL 연결 문자열
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis 설정
- `JWT_SECRET`: JWT 서명 시크릿
- `SPOTIFY_*`: Spotify API 자격 증명 및 엔드포인트

## 코드 패턴

### 에러 처리
적절한 상태 코드와 함께 NestJS HttpException 사용:
```typescript
throw new HttpException('Error message', HttpStatus.BAD_REQUEST);
```

### 유효성 검사
글로벌 ValidationPipe 설정:
- `whitelist: true` - 정의되지 않은 속성 제거
- `forbidNonWhitelisted: true` - 알 수 없는 속성 거부
- `transform: true` - 자동 타입 변환

### 데이터 접근
- 모든 데이터베이스 작업은 PrismaService를 통해 처리
- Redis 작업은 RedisService를 통해 처리
- Spotify API 호출은 `src/utils/spotify.ts`의 유틸리티 함수 사용

### 문서화
각 모듈은 Swagger 문서화 데코레이터가 포함된 `docs/` 디렉토리를 가집니다.

## 테스트
- 유닛 테스트는 Jest 프레임워크 사용
- E2E 테스트는 `/test` 디렉토리에 위치
- 테스트 설정은 package.json의 `jest` 섹션에 정의