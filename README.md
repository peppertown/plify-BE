# 🎵 Plify - Spotify Playlist Sharing Platform

## 📋 프로젝트 개요

Plify는 **확장 가능하고 안정적인 백엔드 아키텍처**를 기반으로 구축된 Spotify 플레이리스트 공유 플랫폼입니다. 현대적인 백엔드 개발 패러다임과 **모범 사례**를 적용하여 개발했습니다.

## 🏗️ 아키텍처 & 기술 스택

### 🎯 핵심 기술 스택

```typescript
📦 Backend Framework
├── NestJS (TypeScript) - 모듈형 아키텍처
├── Prisma ORM - 타입 안전한 데이터베이스 접근
├── MySQL - 관계형 데이터베이스
├── Redis - 세션 관리 및 캐싱
└── JWT - 인증 및 토큰 관리
```

### 🔧 아키텍처 설계 원칙

#### 1. **모듈형 아키텍처 (Modular Architecture)**

```
src/
├── module/           # 도메인별 모듈 분리
│   ├── auth/        # 인증 & 인가
│   ├── playlist/    # 플레이리스트 관리
│   ├── comment/     # 댓글 시스템
│   ├── rank/        # 사용자 통계 & 랭킹
│   ├── follow/      # 소셜 기능
│   └── cron/        # 배치 작업
├── common/          # 공통 유틸리티
├── config/          # 환경설정 관리
└── utils/           # 헬퍼 함수
```

#### 2. **설정 관리 중앙화 (Centralized Configuration)**

```typescript
// ConfigModule을 통한 타입 안전한 환경변수 관리
export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    // ... 모든 설정 중앙화
  },
});
```

#### 3. **전역 예외 처리 (Global Exception Handling)**

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Prisma 에러, HTTP 예외, 일반 에러 통합 처리
    // 환경별 에러 메시지 분기 (개발/운영)
    // 에러 추적을 위한 고유 ID 생성
  }
}
```

## 🚀 핵심 기능 구현

### 1. **OAuth 2.0 기반 인증 시스템**

```typescript
// Spotify OAuth + JWT 하이브리드 인증
@Injectable()
export class AuthService {
  // Spotify OAuth 플로우
  async handleSpotifyCallback(user: SpotifyAuthDto) {
    // 1. Spotify 사용자 정보 검증
    // 2. 데이터베이스 사용자 생성/업데이트
    // 3. JWT 토큰 발급
    // 4. Redis 세션 관리
  }
}
```

### 2. **실시간 데이터 동기화**

```typescript
// Spotify API와 실시간 동기화
async refetchPlaylist(userId: number, playlistId: string) {
  const spotifyAccessToken = await this.getValidAccessToken(userId);
  const playlistData = await fetchPlaylist(playlistId, spotifyAccessToken);

  // 트랜잭션으로 데이터 일관성 보장
  await this.prisma.$transaction(async (tx) => {
    await tx.playlist.update(/* ... */);
    await tx.playlistItems.deleteMany(/* ... */);
    await tx.playlistItems.createMany(/* ... */);
  });
}
```

### 3. **고성능 사용자 통계 시스템**

```typescript
// 시간대별 Top 트랙/아티스트 분석
async handleUserTopTracks(accessToken: string, userId: number, range: string) {
  const timeRange = this.getTimeRange(range);

  // 이전 랭킹과 비교하여 순위 변동 계산
  const rankDifferences = this.calculateRankDifferences(
    previousRank,
    currentTopTracks
  );

  // 배치 업서트로 성능 최적화
  await this.prisma.userTopTrack.createMany({
    data: tracksWithDiff,
    skipDuplicates: true,
  });
}
```

### 4. **Redis 기반 세션 관리**

```typescript
// 분산 환경을 고려한 세션 관리
async storeRefreshToken(userId: number, refreshToken: string, type: 'jwt' | 'spotify') {
  const key = `${this.configService.get(`keys.refreshKey${type}`)}:${userId}`;
  await this.redis.setex(key, 60 * 60 * 24 * 30, refreshToken); // 30일
}
```

## 📊 데이터베이스 설계

### ERD 주요 설계 포인트

```sql
-- 1. 사용자 중심 설계
User (1) ─── (N) Playlist
User (1) ─── (N) UserTopTrack/Artist/Genre
User (N) ─── (N) UserFollow

-- 2. 정규화를 통한 데이터 무결성
Playlist (1) ─── (N) PlaylistItems
Playlist (N) ─── (N) Genre (PlaylistGenres 중간테이블)

-- 3. 소셜 기능 지원
Comment (N) ─── (1) User
Comment (1) ─── (N) CommentLike
Playlist (1) ─── (N) PlaylistLike
```

### 인덱스 최적화

```prisma
model UserTopTrack {
  // 시간 범위별 조회 최적화
  @@index([timeRange, snapshotAt])

  // 중복 방지 및 빠른 조회
  @@unique([userId, trackId, snapshotAt, timeRange])
}
```

## 🔒 보안 & 성능

### 1. **데이터 검증 (Validation Pipeline)**

```typescript
// 글로벌 Validation Pipe 설정
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // 정의되지 않은 속성 제거
    forbidNonWhitelisted: true, // 알 수 없는 속성 거부
    transform: true, // 자동 타입 변환
  }),
);
```

### 2. **API 문서화 (OpenAPI/Swagger)**

```typescript
// 자동 API 문서 생성
@ApiOperation({ summary: '플레이리스트 생성' })
@ApiResponse({ status: 201, type: PlaylistResponseDto })
@ApiResponse({ status: 400, description: '잘못된 요청' })
@Post()
async createPlaylist(@Body() dto: AddPlaylistDto) {
  // Implementation
}
```

### 3. **에러 추적 & 모니터링**

```typescript
// 구조화된 에러 로깅
this.logger.error(`[${errorId}] ${exception.message}`, {
  errorId,
  userId: request.user?.id,
  path: request.url,
  method: request.method,
  stack: exception.stack,
});
```

## 🔄 CI/CD & 배포

### 배포 아키텍처

```bash
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│   NestJS     │───▶│   MySQL     │
│  (Frontend) │    │   Server     │    │  Database   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │    Redis     │
                   │   Cache      │
                   └──────────────┘
```

### 코드 품질 관리

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## 📈 확장성 고려사항

### 1. **모듈형 설계로 수평 확장 가능**

- 각 도메인이 독립적으로 확장 가능
- 마이크로서비스 전환 시 최소한의 수정으로 분리 가능

### 2. **캐싱 전략**

- Redis를 통한 세션 데이터 캐싱
- Spotify API 응답 캐싱으로 외부 API 호출 최소화

### 3. **비동기 처리**

```typescript
// 스케줄러를 통한 배치 작업
@Cron('0 0 * * *') // 매일 자정
async updateUserStats() {
  // 사용자 통계 업데이트 배치 작업
}
```

## 🛠️ 개발 경험 최적화

### 1. **타입 안전성 (Type Safety)**

- TypeScript 100% 적용
- Prisma를 통한 타입 안전한 DB 스키마
- DTO 기반 API 입출력 타입 정의

### 2. **개발자 경험 (Developer Experience)**

```typescript
// Hot Module Replacement 지원
npm run start:dev

// 실시간 API 문서
// http://localhost:3000/api-docs

// 타입 체크 및 빌드
npm run build
```

### 3. **테스트 환경**

```typescript
// 유닛 테스트 + E2E 테스트 환경 구축
describe('AuthService', () => {
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService /* mocked providers */],
    }).compile();
  });
});
```

## 🎯 프로젝트 하이라이트

### ✨ 기술적 성취

- **확장 가능한 모듈형 아키텍처** 설계
- **타입 안전성**을 보장하는 엔드투엔드 TypeScript 적용
- **실시간 데이터 동기화** 및 **배치 처리** 시스템 구현
- **전역 예외 처리** 및 **구조화된 로깅** 시스템
- **OAuth 2.0 + JWT** 하이브리드 인증 시스템

### 📚 학습 및 적용한 개념

- **SOLID 원칙** 적용한 객체지향 설계
- **의존성 주입(DI)** 및 **제어 역전(IoC)** 패턴
- **데이터베이스 정규화** 및 **인덱스 최적화**
- **RESTful API 설계** 및 **OpenAPI 문서화**
- **캐싱 전략** 및 **성능 최적화**

---

**💡 이 프로젝트는 단순한 CRUD 애플리케이션을 넘어서, 실제 프로덕션 환경에서 사용 가능한 수준의 백엔드 시스템을 구현했습니다.**
