import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpotifyAuthDto } from './dto/spotify.auth.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  private verifyRefreshToken(token: string): any {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return decoded;
    } catch (error) {
      console.error('리프레시 토큰 검증 실패:', error.message);
      throw new HttpException(
        '유효하지 않은 리프레시 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private filterUserFields(user: any) {
    if (!user) {
      throw new HttpException(
        '유저 정보가 올바르지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileUrl: user.profile_url,
      authProvider: user.auth_provider,
    };
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
        process.env.SPOTIFY_TOKEN_URL,
        params,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token, refresh_token } = tokenResponse.data;

      // 2. 스포티파이 유저 정보 조회
      const userInfoResponse = await axios.get(
        process.env.SPOTIFY_USER_INFO_URL,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );
      const userData = userInfoResponse.data;

      if (!userData.id) {
        throw new HttpException(
          'Spotify 사용자 ID를 가져올 수 없습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. 유저 데이터 매핑
      const spotifyUser: SpotifyAuthDto = {
        spotifyId: userData.id,
        email: userData.email || `${userData.id}@spotify.com`,
        displayName: userData.display_name || userData.id,
        profileImageUrl: userData.images?.[0]?.url || null,
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
            auth_provider: 'spotify',
          },
        });
      }

      const [followersCount, followingsCount] = await Promise.all([
        this.prisma.userFollow.count({
          where: { followeeId: user.id },
        }),
        this.prisma.userFollow.count({
          where: { followerId: user.id },
        }),
      ]);

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
        user: { ...responseUser, followersCount, followingsCount },
        jwt: {
          accessToken,
          refreshToken,
        },
        spotify: {
          accessToken: access_token,
          refreshToken: refresh_token,
        },
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      console.error('스포티파이 Oauth 로그인 중 에러 발생', err);
      throw new HttpException(
        '스포티파이 Oauth 로그인에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleRefresh(refreshToken: string) {
    try {
      // 1. JWT refreshToken 검증 및 유저 ID 파악
      const decoded = this.verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // 2. Redis에서 Spotify refreshToken 가져오기
      const spotifyRefreshToken = await this.redis.get(
        `${process.env.REFRESH_KEY_SPOTIFY}:${userId}`,
      );
      if (!spotifyRefreshToken) {
        throw new HttpException(
          '스포티파이 리프레시 토큰을 찾을 수 없습니다',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Spotify access_token 리프레시
      const spotifyAccessToken =
        await this.refreshSpotifyAccessToken(spotifyRefreshToken);

      // 4. 새로운 JWT access/refresh 발급
      const newAccessToken = await this.generateAccessToken(userId);
      const newRefreshToken = await this.generateRefreshToken(userId);

      // 5. Redis에 새로운 JWT refreshToken 저장
      await this.saveServerRefreshToken(userId, newRefreshToken);

      // 6. 새로운 엑세스 토큰으로 유저 데이터 조회
      const userInfoResponse = await axios.get(
        process.env.SPOTIFY_USER_INFO_URL,
        {
          headers: { Authorization: `Bearer ${spotifyAccessToken}` },
        },
      );
      const userData = userInfoResponse.data;

      if (!userData.id) {
        throw new HttpException(
          '스포티파이 사용자 ID를 가져올 수 없습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 7. 유저 데이터 매핑 후 DB 저장
      const spotifyUser: SpotifyAuthDto = {
        spotifyId: userData.id,
        email: userData.email || `${userData.id}@spotify.com`,
        displayName: userData.display_name || userData.id,
        profileImageUrl: userData.images?.[0]?.url || null,
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: spotifyUser.email,
          name: spotifyUser.displayName,
          profile_url: spotifyUser.profileImageUrl,
        },
      });

      const user = {
        userId,
        email: userData.email,
        name: userData.display_name,
        nickname: userData.display_name,
        profileUrl: userData.images[0].url,
        authProvider: 'spotify',
      };

      // 8. 응답
      return {
        message: {
          code: 200,
          message: '토큰 재발급 성공',
        },
        user,
        jwt: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        spotify: {
          accessToken: spotifyAccessToken,
          refreshToken: spotifyRefreshToken,
        },
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err; // 네가 명시적으로 던진 예외라면 그대로 전달
      }
      console.error(err);
      throw new HttpException(
        '토큰 재발급 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(id: string) {
    if (id == process.env.TEST_ID) {
      return {
        accessToken: await this.generateAccessToken(2),
      };
    } else {
      return false;
    }
  }

  async refreshSpotifyAccessToken(refreshToken: string): Promise<string> {
    try {
      const basicToken = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await axios.post(process.env.SPOTIFY_TOKEN_URL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicToken}`,
        },
      });

      const { access_token } = response.data;
      if (!access_token) {
        throw new HttpException(
          '스포티파이 액세스 토큰 갱신에 실패했습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return access_token;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      console.error('스포티파이 액세스 토큰 갱신 오류 발생', err);
      throw new HttpException(
        '스포티파이 액세스 토큰 갱신 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateAccessToken(userId: number): Promise<string> {
    try {
      return await this.jwt.signAsync(
        { userId },
        { expiresIn: '1h' }, // 액세스 토큰 1시간
      );
    } catch (err) {
      console.error('액세스 토큰 생성 실패:', err);
      throw new HttpException(
        '액세스 토큰 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateRefreshToken(userId: number): Promise<string> {
    try {
      return this.jwt.signAsync(
        { userId },
        { expiresIn: '7d' }, // 리프레시 토큰 7일
      );
    } catch (err) {
      console.error('리프레시 토큰 생성 실패:', err);
      throw new HttpException(
        '리프레시 토큰 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveServerRefreshToken(userId: number, refreshToken: string) {
    try {
      const key = `${process.env.REFRESH_KEY_JWT}:${userId}`;
      const ttlSeconds = 7 * 24 * 60 * 60; // 7일
      await this.redis.set(key, refreshToken, ttlSeconds);
    } catch (err) {
      console.error('JWT 리프레시 토큰 레디스 저장 실패', err);
      throw new HttpException(
        'JWT 리프레시 토큰 레디스 저장 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveSpotifyRefreshToken(userId: number, spotifyRefreshToken: string) {
    try {
      const key = `${process.env.REFRESH_KEY_SPOTIFY}:${userId}`;
      const ttlSeconds = 30 * 24 * 60 * 60; // 30일
      await this.redis.set(key, spotifyRefreshToken, ttlSeconds);
    } catch (err) {
      console.error('스포티파이 리프레시 토큰 레디스 저장 실패', err);
      throw new HttpException(
        '스포티파이 리프레시 토큰 레디스 저장 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(userId: number) {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        message: {
          code: 200,
          text: '회원 탈퇴가 완료되었습니다.',
        },
      };
    } catch (err) {
      console.error('회원 탈퇴 중 에러 발생', err);
      throw new HttpException(
        '회원 탈퇴 중 서버 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
