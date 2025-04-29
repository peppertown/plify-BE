import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpotifyAuthDto } from './dto/spotify.auth.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  async generateAccessToken(userId: number): Promise<string> {
    return this.jwt.signAsync(
      { userId },
      { expiresIn: '15m' }, // 액세스 토큰 15분
    );
  }

  async generateRefreshToken(userId: number): Promise<string> {
    return this.jwt.signAsync(
      { userId },
      { expiresIn: '7d' }, // 리프레시 토큰 7일
    );
  }

  async saveServerRefreshToken(userId: number, refreshToken: string) {
    const key = `server_refresh_token:${userId}`;
    const ttlSeconds = 7 * 24 * 60 * 60; // 7일
    await this.redis.set(key, refreshToken, ttlSeconds);
  }

  async saveSpotifyRefreshToken(userId: number, spotifyRefreshToken: string) {
    const key = `spotify_refresh_token:${userId}`;
    const ttlSeconds = 30 * 24 * 60 * 60; // 30일
    await this.redis.set(key, spotifyRefreshToken, ttlSeconds);
  }

  async handleSpotifyCallback(code: string) {
    try {
      // 1. 스포티파이 토큰 요청
      const params = new URLSearchParams({
        code,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
        grant_type: 'authorization_code',
      });

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token, refresh_token } = tokenResponse.data;

      // 2. 스포티파이 유저 정보 조회
      const userInfoResponse = await axios.get(
        'https://api.spotify.com/v1/me',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );
      const userData = userInfoResponse.data;

      if (!userData.id) {
        throw new Error('Spotify 사용자 ID를 가져올 수 없음');
      }

      // 3. 유저 데이터 매핑
      const spotifyUser: SpotifyAuthDto = {
        spotifyId: userData.id,
        email: userData.email || `${userData.id}@spotify.com`,
        displayName: userData.display_name || userData.id,
        profileImageUrl: userData.images?.[0]?.url || null,
        followersCount: userData.followers?.total || 0,
      };

      // 4. 기존 유저 조회 또는 업데이트
      let user = await this.prisma.user.findUnique({
        where: { spotifyId: spotifyUser.spotifyId },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email: spotifyUser.email,
            name: spotifyUser.displayName,
            profile_url: spotifyUser.profileImageUrl,
            followersCount: spotifyUser.followersCount,
          },
        });
      } else {
        // 신규 유저 생성
        let finalNickname = spotifyUser.displayName;
        let isNicknameTaken = await this.prisma.user.findUnique({
          where: { nickname: finalNickname },
        });
        while (isNicknameTaken) {
          const randomNumber = Math.floor(1000 + Math.random() * 9000);
          finalNickname = `${spotifyUser.displayName}${randomNumber}`;
          isNicknameTaken = await this.prisma.user.findUnique({
            where: { nickname: finalNickname },
          });
        }
        user = await this.prisma.user.create({
          data: {
            spotifyId: spotifyUser.spotifyId,
            email: spotifyUser.email,
            name: spotifyUser.displayName,
            nickname: finalNickname,
            profile_url: spotifyUser.profileImageUrl,
            followersCount: spotifyUser.followersCount,
            auth_provider: 'spotify',
          },
        });
      }

      // 5. 유저 응답 데이터 정리
      const responseUser = this.filterUserFields(user);

      // 6. jwt 토큰 발급
      const accessToken = await this.generateAccessToken(user.id);
      const refreshToken = await this.generateRefreshToken(user.id);

      // 7. 리프레시 토큰 레디스에 저장
      await this.saveServerRefreshToken(user.id, refreshToken);
      await this.saveSpotifyRefreshToken(user.id, refresh_token);

      return {
        message: {
          code: 200,
          message: '스포티파이 로그인 성공',
        },
        user: responseUser,
        jwt: {
          accessToken,
          refreshToken,
        },
        spotify: {
          accessToken: access_token,
          refreshToken: refresh_token,
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException('스포티파이 인증 실패', HttpStatus.BAD_REQUEST);
    }
  }
  private filterUserFields(user: any) {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileUrl: user.profile_url,
      authProvider: user.auth_provider,
    };
  }
}
