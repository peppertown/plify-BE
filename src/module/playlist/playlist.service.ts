import { playlistBaseInclude } from './helpers/playlist.query.option';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddPlaylistDto } from './dto/addPlaylist.dto';
import { AuthService } from '../auth/auth.service';
import { RedisService } from 'src/redis/redis.service';
import { UpdatePlaylistDto } from './dto/updatePlaylist.dto';
import { formatComment, formatPlaylist } from 'src/utils/formatter';
import {
  extractPlaylistId,
  fetchPlaylist,
  fetchPlaylistItems,
} from 'src/utils/spotify';

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly redis: RedisService,
  ) {}

  // 전체 플레이리스트 조회
  async getAllPlaylists(userId: number) {
    try {
      let result = await this.prisma.playlist.findMany({
        orderBy: { id: 'desc' },
        include: playlistBaseInclude(userId),
      });

      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      const shouldRefetch = result
        .filter((res) => new Date(res.lastFetchedAt) < twelveHoursAgo)
        .map((res) => res.playlistId);

      if (shouldRefetch.length) {
        await Promise.all(
          shouldRefetch.map((playlist) =>
            this.refetchPlaylist(userId, playlist),
          ),
        );

        result = await this.prisma.playlist.findMany({
          orderBy: { id: 'desc' },
          include: playlistBaseInclude(userId),
        });
      }

      const playlists = result.map((res) => formatPlaylist(res));

      return {
        playlists,
        message: {
          code: 200,
          text: '전체 플레이리스트를 정상적으로 조회했습니다.',
        },
      };
    } catch (err) {
      console.error('전체 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '전체 플레이리스트 조회 중 서버 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 개별 조회
  async getPlaylist(postId: number, userId: number) {
    try {
      // 조회수 증가
      await this.prisma.playlist.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });

      const playlistDetail = await this.prisma.playlist.findUnique({
        where: { id: postId },
        select: {
          userId: true,
          explanation: true,
          externalUrl: true,
          PlaylistItems: true,
        },
      });

      const tracks = playlistDetail.PlaylistItems.map((i) => ({
        trackId: i.trackId,
        title: i.title,
        artistName: i.artistName,
        artistExternalUrl: i.artistExternalUrl,
        imageUrl: i.imageUrl,
        externalUrl: i.externalUrl,
        durationMs: i.durationMs,
      }));

      const totalDuration = tracks.reduce(
        (sum, track) => sum + track.durationMs,
        0,
      );

      const result = await this.prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              name: true,
              nickname: true,
              profile_url: true,
            },
          },
          _count: {
            select: { likes: true }, // 좋아요 수
          },
          likes: {
            where: { userId }, // 유저 좋아요 여부
            select: { id: true },
          },
        },
      });

      const comment = result.map((res) => formatComment(res));

      const isFollowed = await this.prisma.userFollow.findFirst({
        where: { followeeId: playlistDetail.userId, followerId: userId },
      });

      return {
        explanation: playlistDetail.explanation,
        comment,
        externalUrl: playlistDetail.externalUrl,
        tracks,
        totalTrack: tracks.length,
        totalDuration,
        commentCount: comment.length,
        isFollowed: !!isFollowed,
        message: {
          code: 200,
          text: '개별 플레이리스트를 정상적으로 조회했습니다.',
        },
      };
    } catch (err) {
      if (err.code === 'P2025') {
        throw new HttpException(
          '플레이리스트를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      console.error('플레이리스트 개별 조회 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 개별 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 장르별 플레이리스트 조회
  async getGenrePlaylists(userId: number, genreId: number) {
    try {
      const result = await this.prisma.playlist.findMany({
        where: {
          PlaylistGenres: {
            some: {
              genreId,
            },
          },
        },
        orderBy: { id: 'desc' },
        include: playlistBaseInclude(userId),
      });

      const playlists = result.map((res) => formatPlaylist(res));

      return {
        playlists,
        message: {
          code: 200,
          text: '장르별 플레이리스트를 정상적으로 조회했습니다.',
        },
      };
    } catch (err) {
      console.error('장르별 플레이리스트 조회 중 에러 발생', err);
      throw new HttpException(
        '장르별 플레이리스트 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 추가
  async addPlaylist(userId: number, addPlaylistDto: AddPlaylistDto) {
    try {
      const { playlistUrl, explanation, genres } = addPlaylistDto;

      const spotifyRefreshToken = await this.redis.get(
        `${process.env.REFRESH_KEY_SPOTIFY}:${userId}`,
      );

      const spotifyAccessToken =
        await this.authService.refreshSpotifyAccessToken(spotifyRefreshToken);

      const playlistId = extractPlaylistId(playlistUrl);

      const playlistData = await fetchPlaylist(playlistId, spotifyAccessToken);

      const playlistItems = await fetchPlaylistItems(
        playlistId,
        spotifyAccessToken,
      );

      const newPlaylist = await this.prisma.$transaction(async (tx) => {
        const createdPlaylist = await tx.playlist.create({
          data: { userId, playlistId, explanation, ...playlistData },
        });

        await tx.playlistItems.createMany({
          data: playlistItems.map((i) => ({
            playlistId: createdPlaylist.id,
            ...i,
          })),
        });

        await tx.playlistGenres.createMany({
          data: genres.map((genre) => ({
            playlistId: createdPlaylist.id,
            genreId: genre,
          })),
        });

        return createdPlaylist;
      });
      return {
        message: {
          code: 200,
          text: '플레이리스트가 생성되었습니다.',
        },
        playlists: {
          id: newPlaylist.id,
        },
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      console.error('플레이리스트 생성 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 생성 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 수정
  async updatePlaylist(postId: number, updatePlaylistDto: UpdatePlaylistDto) {
    try {
      const { explanation, genres } = updatePlaylistDto;

      await this.prisma.$transaction(async (prisma) => {
        if (explanation) {
          await prisma.playlist.update({
            where: { id: postId },
            data: { explanation },
          });
        }

        if (genres) {
          await prisma.playlistGenres.deleteMany({
            where: { playlistId: postId },
          });

          const data = genres.map((i) => ({
            playlistId: postId,
            genreId: i,
          }));

          await prisma.playlistGenres.createMany({
            data,
          });
        }
      });

      return {
        message: { code: 200, text: '플레이리스트 수정이 완료됐습니다' },
      };
    } catch (err) {
      console.error('플레이리스트 수정 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 수정 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 삭제
  async deletePlaylist(postId: number, userId: number) {
    try {
      // 플레이리스트 존재 여부 및 작성자 확인
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: postId },
      });

      if (!playlist) {
        throw new HttpException(
          '플레이리스트를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      if (playlist.userId !== userId) {
        throw new HttpException(
          '플레이리스트를 삭제할 권한이 없습니다.',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.playlist.delete({
        where: { id: postId },
      });

      return {
        message: {
          code: 200,
          text: '플레이리스트가 삭제되었습니다.',
        },
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      console.error('플레이리스트 삭제 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 삭제 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 삭제된 플레이리스트 삭제
  async handelDeleted(playlistId: string) {
    try {
      await this.prisma.playlist.delete({
        where: { playlistId },
      });

      return {
        message: {
          code: 200,
          text: '삭제된 플레이리스트를 삭제했습니다.',
        },
      };
    } catch (err) {
      console.error('삭제된 플레이리스트 삭제 중 에러 발생', err);
      throw new HttpException(
        '삭제된 플레이리스트 삭제 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 좋아요 토글
  async togglePlaylistLike(userId: number, postId: number) {
    try {
      const existing = await this.prisma.playlistLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existing) {
        await this.prisma.playlistLike.delete({
          where: { id: existing.id },
        });

        return {
          message: {
            code: 200,
            text: '플레이리스트 좋아요가 취소되었습니다.',
          },
        };
      } else {
        await this.prisma.playlistLike.create({
          data: { userId, postId },
        });

        return {
          message: {
            code: 200,
            text: '플레이리스트 좋아요가 추가됐습니다.',
          },
        };
      }
    } catch (err) {
      console.error('플레이리스트 좋아요 토글 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 좋아요 토글 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 장르 조회
  async getAllGenres() {
    try {
      const genres = await this.prisma.genre.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        genres,
        message: {
          code: 200,
          text: '전체 장르를 성공적으로 조회했습니다.',
        },
      };
    } catch (err) {
      console.error('장르 데이터 조회 중 에러 발생', err);
      throw new HttpException(
        '장르 데이터 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 플레이리스트 리페칭
  async refetchPlaylist(userId: number, playlistId: string) {
    try {
      const spotifyRefreshToken = await this.redis.get(
        `${process.env.REFRESH_KEY_SPOTIFY}:${userId}`,
      );

      const spotifyAccessToken =
        await this.authService.refreshSpotifyAccessToken(spotifyRefreshToken);

      const playlistData = await fetchPlaylist(playlistId, spotifyAccessToken);

      const { userName, name, imageUrl } = playlistData;

      const playlistItems = await fetchPlaylistItems(
        playlistId,
        spotifyAccessToken,
      );

      await this.prisma.$transaction(async (tx) => {
        const playlist = await tx.playlist.update({
          where: { playlistId },
          data: {
            userName,
            name,
            imageUrl,
            lastFetchedAt: new Date(),
          },
        });

        await tx.playlistItems.deleteMany({
          where: { playlistId: playlist.id },
        });

        await tx.playlistItems.createMany({
          data: playlistItems.map((item) => ({
            playlistId: playlist.id,
            ...item,
          })),
        });
      });
    } catch (err) {
      console.error('플레이리스트 리페칭 중 에러 발생', err);
      throw new HttpException(
        '플레이리스트 리페칭 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
