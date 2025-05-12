import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddPlaylistDto } from './dto/addPlaylist.dto';
import axios from 'axios';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  // 전체 플레이리스트 조회
  async getAllPlaylists(userId: number) {
    try {
      const result = await this.prisma.playlist.findMany({
        orderBy: { id: 'desc' },
        include: {
          _count: { select: { PlaylistLike: true, Comment: true } },
          PlaylistGenres: { select: { genre: { select: { name: true } } } },

          PlaylistLike: { where: { userId }, select: { id: true } },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              nickname: true,
              profile_url: true,
            },
          },
        },
      });

      const playlists = result.map((res) => this.getPlaylistObj(res));

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
        select: { userId: true, explanation: true },
      });

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

      const comment = result.map((res) => this.getCommentObj(res));

      const isFollowed = await this.prisma.userFollow.findFirst({
        where: { followeeId: playlistDetail.userId, followerId: userId },
      });

      return {
        explanation: playlistDetail.explanation,
        comment,
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
        include: {
          _count: { select: { PlaylistLike: true, Comment: true } },
          PlaylistGenres: { select: { genre: { select: { name: true } } } },

          PlaylistLike: { where: { userId }, select: { id: true } },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              nickname: true,
              profile_url: true,
            },
          },
        },
      });

      const playlists = result.map((res) => this.getPlaylistObj(res));

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
      const { playlistUrl, explanation, genres, code } = addPlaylistDto;

      const playlistId = this.extractPlaylistId(playlistUrl);

      const playlistData = await this.fetchPlaylist(playlistId, code);

      const newPlaylist = await this.prisma.playlist.create({
        data: {
          userId,
          playlistId,
          explanation,
          ...playlistData,
        },
      });

      let playlistItems = await this.fetchPlaylistItems(playlistId, code);
      playlistItems = playlistItems.map((i) => ({
        playlistId: newPlaylist.id,
        ...i,
      }));

      await this.prisma.playlistItems.createMany({
        data: playlistItems,
      });

      const genreData = genres.map((genre) => ({
        playlistId: newPlaylist.id,
        genreId: genre,
      }));

      await this.prisma.playlistGenres.createMany({
        data: genreData,
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

  // 플레이리스트 id 추출
  extractPlaylistId(url: string): string {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    throw new HttpException(
      '유효하지 않은 플레이리스트 주소입니다.',
      HttpStatus.BAD_REQUEST,
    );
  }

  // 응답데이터 포맷
  getPlaylistObj(result: any) {
    return {
      userId: result.user.id,
      userName: result.user.name,
      userNickname: result.user.nickname,
      userProfileUrl: result.user.profile_url,
      postId: result.id,
      playlistId: result.playlistId,
      likeCount: result._count.PlaylistLike,
      commentCount: result._count.Comment,
      genre: result.PlaylistGenres.map((data) => data.genre.name),
      isLiked: !!result.PlaylistLike[0],
      viewCount: result.viewCount,
      createdAt: result.createdAt,
    };
  }

  // 댓글 응답데이터 포맷
  getCommentObj(res: any) {
    return {
      commentId: res.id,
      postId: res.postId,
      userId: res.userId,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      content: res.content,
      createdAt: res.createdAt,
      likeCount: res._count.likes,
      isLiked: !!res.likes[0],
    };
  }

  async fetchPlaylist(playlistId: string, userAccessToken: string) {
    const url = `${process.env.SPOTIFY_PLAYLIST_URL}/${playlistId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    const playlistData = response.data;

    const playlist = {
      imageUrl: playlistData.images[0].url,
      name: playlistData.name,
      userName: playlistData.owner.display_name,
    };

    return playlist;
  }

  async fetchPlaylistItems(playlistId: string, userAccessToken: string) {
    const url = `${process.env.SPOTIFY_PLAYLIST_URL}/${playlistId}/tracks`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Accept-Language': 'ko',
      },
    });

    const tracks = response.data.items.map((i) => ({
      trackId: i.track.id,
      title: i.track.name,
      artistName: i.track.artists.map((a) => a.name).join(', '),
      imageUrl: i.track.album.images?.[0]?.url,
      externalUrl: i.track.external_urls.spotify,
      durationMs: i.track.duration_ms,
    }));

    return tracks;
  }

  async getAllGenres() {
    try {
      const genres = await this.prisma.genre.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc', // 가나다순 or 인기순 등 필요시 조정
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
}
