import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  async handleUserTopTracks(
    spotifyAccessToken: string,
    userId: number,
    range: string,
  ) {
    try {
      // timeRange 설정
      const timeRange = this.getTimeRange(range);

      // DB에서 유저의 랭킹(탑트랙) 조회
      const previousRank = await this.prisma.userTopTrack.findMany({
        where: { userId, timeRange },
        orderBy: { rank: 'asc' },
      });

      // 랭킹 조회 시점 확인
      const lastSnapshot = previousRank[0]?.snapshotAt;

      // 랭킹 조회 시점 없을 시 (랭킹 첫 확인일 시) 예외처리
      if (!lastSnapshot) {
        const currentRank = await this.fetchSpotifyTopTracks(
          spotifyAccessToken,
          timeRange,
        );
        const rank = currentRank.map((data) => ({
          ...data,
          diff: 0, // 첫 랭킹 확인이라 순위 변동 X
        }));

        await this.saveUserTopTrack(currentRank, userId, timeRange);

        return {
          message: {
            code: 200,
            text: '랭킹 조회가 완료됐습니다.',
          },
          rank,
        };
      }

      // 랭킹 변동값 측정 주기(하루)가 지났는지 확인
      const now = new Date();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const shouldUpdate = now.getTime() - lastSnapshot.getTime() > ONE_DAY;

      // 주기 지났을 시 새로운 데이터 받아오고 기존 데이터 삭제 후 저장
      if (shouldUpdate) {
        const currentRank = await this.fetchSpotifyTopTracks(
          spotifyAccessToken,
          timeRange,
        );
        await this.prisma.userTopTrack.deleteMany({
          where: { userId, timeRange },
        });

        // 랭킹 변동값 측정
        const rank = currentRank.map((curr) => {
          const prev = previousRank.find((p) => p.trackId === curr.trackId);
          const diff = prev ? prev.rank - curr.rank : null;

          return {
            rank: curr.rank,
            trackId: curr.trackId,
            name: curr.name,
            imageUrl: curr.imageUrl,
            artistId: curr.artistId,
            artistName: curr.artistName,
            externalUrl: curr.externalUrl,
            diff,
          };
        });

        await this.saveUserTopTrack(rank, userId, timeRange);

        return {
          message: {
            code: 200,
            text: '랭킹 조회가 완료됐습니다.',
          },
          rank,
        };
      }

      const rank = previousRank.map((curr) => {
        return {
          rank: curr.rank,
          trackId: curr.trackId,
          name: curr.name,
          imageUrl: curr.imageUrl,
          artistId: curr.artistId,
          artistName: curr.artistName,
          externalUrl: curr.externalUrl,
          diff: curr.diff,
        };
      });

      return {
        message: {
          code: 200,
          text: '랭킹 조회가 완료됐습니다.',
        },
        rank,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      console.error('유저 탑 트랙 핸들러 로직에서 에러 발생', err);
      throw new HttpException(
        '유저 탑 트랙 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleUserTopArtists(
    spotifyAccessToken: string,
    userId: number,
    range: string,
  ) {
    try {
      // timeRange 설정
      const timeRange = this.getTimeRange(range);

      // DB에서 유저의 탑 아티스트 조회
      const previousRank = await this.prisma.userTopArtist.findMany({
        where: { userId, timeRange },
        orderBy: { rank: 'asc' },
      });

      // 랭킹 조회 시점 확인
      const lastSnapshot = previousRank[0]?.snapshotAt;

      if (!lastSnapshot) {
        const { data, genres } = await this.fetchSpotifyTopArtists(
          spotifyAccessToken,
          timeRange,
        );

        const currentRank = data;

        const rank = currentRank.map((data) => ({
          ...data,
          diff: 0, // 첫 랭킹 확인이라 순위 변동 X
        }));

        await this.saveUserTopArtist(rank, userId, timeRange);
        await this.saveUserTopGenres(range, genres, userId);

        return {
          message: {
            code: 200,
            text: '랭킹 조회가 완료됐습니다.',
          },
          rank,
        };
      }

      // 랭킹 변동값 측정 주기(하루)가 지났는지 확인
      const now = new Date();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const shouldUpdate = now.getTime() - lastSnapshot.getTime() > ONE_DAY;

      // 주기 지났을 시 새로운 데이터 받아오고 기존 데이터 삭제 후 저장
      if (shouldUpdate) {
        const { data, genres } = await this.fetchSpotifyTopArtists(
          spotifyAccessToken,
          timeRange,
        );

        const currentRank = data;

        await this.prisma.userTopArtist.deleteMany({
          where: { userId, timeRange },
        });

        await this.prisma.userTopGenre.deleteMany({
          where: { userId, timeRange },
        });

        // 랭킹 변동값 측정
        const rank = currentRank.map((curr) => {
          const prev = previousRank.find((p) => p.artistId === curr.artistId);

          const diff = prev ? prev.rank - curr.rank : null;

          return {
            rank: curr.rank,
            artistId: curr.artistId,
            name: curr.name,
            imageUrl: curr.imageUrl,
            externalUrl: curr.externalUrl,
            diff, // 숫자 or null(랭킹 신규 진입)
          };
        });

        await this.saveUserTopArtist(rank, userId, timeRange);
        await this.saveUserTopGenres(range, genres, userId);

        return {
          message: {
            code: 200,
            text: '랭킹 조회가 완료됐습니다.',
          },
          rank,
        };
      }

      const rank = previousRank.map((curr) => ({
        rank: curr.rank,
        artistId: curr.artistId,
        name: curr.name,
        imageUrl: curr.imageUrl,

        externalUrl: curr.externalUrl,
        diff: curr.diff,
      }));

      return {
        message: {
          code: 200,
          text: '랭킹 조회가 완료됐습니다.',
        },
        rank,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      console.error('유저 탑 아티스트 핸들러 로직에서 에러 발생', err);
      throw new HttpException(
        '유저 탑 아티스트 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getTimeRange(range: string) {
    const timeRangeMap = {
      short: 'short_term',
      medium: 'medium_term',
      long: 'long_term',
    } as const;

    const timeRange = timeRangeMap[range as keyof typeof timeRangeMap];

    if (!timeRange) {
      throw new HttpException(
        '잘못된 range 값입니다. short, medium, long 중 하나여야 합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return timeRange;
  }

  // 유저 탑 트랙 조회 (스포티파이)
  // 예외처리 /
  async fetchSpotifyTopTracks(userAccessToken: string, term: string) {
    try {
      const url = `${process.env.SPOTIFY_TOP_TRACK_URL}${term}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          'Accept-Language': 'ko',
        },
      });

      const data = response.data.items.map((item, i) => ({
        rank: i + 1,
        trackId: item.id,
        name: item.name,
        imageUrl: item.album.images?.[0]?.url || null,
        artistId: item.artists?.[0]?.id || null,
        artistName: item.artists?.map((a) => a.name).join(', ') || '',
        externalUrl: item.external_urls?.spotify || null,
      }));

      return data;
    } catch (err) {
      console.error('스포티파이 탑 트랙 페칭 중 에러 발생', err);
      throw new HttpException(
        '스포티파이 탑 트랙을 불러오는 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 예외처리 /
  async fetchSpotifyTopArtists(userAccessToken: string, term: string) {
    try {
      const url = `${process.env.SPOTIFY_TOP_ARTIST_URL}${term}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          'Accept-Language': 'ko',
        },
      });

      const genreMap = new Map();

      const data = response.data.items.map((item, i) => {
        const artistInfo = {
          rank: i + 1,
          artistId: item.id,
          name: item.name,
          imageUrl: item.images?.[0]?.url || null,
          externalUrl: item.external_urls?.spotify || null,
        };

        item.genres?.forEach((genre: string) => {
          if (!genreMap.has(genre)) {
            genreMap.set(genre, []);
          }
          genreMap.get(genre)!.push(artistInfo);
        });

        return artistInfo;
      });

      const genres = Object.fromEntries(
        Array.from(genreMap.entries()).sort(
          (a, b) => b[1].length - a[1].length,
        ),
      );

      return { data, genres };
    } catch (err) {
      console.error('스포티파이 탑 아티스트 페칭 중 에러 발생', err);
      throw new HttpException(
        '스포티파이 탑 아티스트를 불러오는 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 유저 탑 트랙 DB에 저장
  async saveUserTopTrack(result: any, userId: number, timeRange: string) {
    try {
      const data = result.map((res) => ({
        ...res,
        userId,
        timeRange,
      }));
      await this.prisma.userTopTrack.createMany({ data });
    } catch (err) {
      console.error('유저 탑 트랙 DB 저장 중 에러 발생', err);
      throw new HttpException(
        '유저 탑 트랙 DB 저장 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 유저 탑 아티스트 DB에 저장
  async saveUserTopArtist(result: any, userId: number, timeRange: string) {
    try {
      const data = result.map((res) => ({
        ...res,
        userId,
        timeRange,
      }));
      await this.prisma.userTopArtist.createMany({ data });
    } catch (err) {
      console.error('유저 탑 아티스트 DB 저장 중 에러 발생', err);
      throw new HttpException(
        '유저 탑 아티스트 DB 저장 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveUserTopGenres(timeRange: string, genreMap: string, userId: number) {
    try {
      const parsedTimeRange = this.getTimeRange(timeRange);

      const genreData = Object.entries(genreMap).map(
        ([genre, artists], index) => ({
          userId,
          rank: index + 1, // 많이 들은 장르일수록 앞에 있으니 1부터 부여
          genre,
          artistData: JSON.stringify(artists), // 배열 -> 문자열로 변환
          timeRange: parsedTimeRange,
        }),
      );

      await this.prisma.userTopGenre.createMany({
        data: genreData,
      });
    } catch (err) {
      console.error('유저 탑 장르 DB 저장 중 에러 발생', err);
      throw new HttpException(
        '유저 탑 장르 DB 저장 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserTopGenres(userId: number, range: string) {
    try {
      const timeRange = this.getTimeRange(range);

      const result = await this.prisma.userTopGenre.findMany({
        where: { userId, timeRange },
      });
      const genres = result.map((res) => ({
        userId: res.userId,
        rank: res.rank,
        genre: res.genre,
        artistData: JSON.parse(res.artistData).map((data) => ({
          id: data.artistId,
          name: data.name,
          imageUrl: data.imageUrl,
          externalUrl: data.externalUrl,
        })),
      }));

      return {
        message: {
          code: 200,
          text: '장르 조회가 완료됐습니다.',
        },
        genres,
      };
    } catch (err) {
      console.error('유저 탑 장르 조회 중 에러 발생', err);
      throw new HttpException(
        '유저 탑 장르 조회 중 오류가 발생했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
