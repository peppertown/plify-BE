import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddPlaylistDto {
  @IsNotEmpty({ message: '플레이리스트 URL을 입력해주세요.' })
  @IsString()
  playlistUrl: string;

  @IsOptional()
  @IsString()
  explanation: string;

  @IsArray({ message: '장르 목록은 배열로 전달되어야합니다.' })
  genres: number[];

  @IsNotEmpty({ message: '스포티파이 엑세스 토큰을 입력해주세요.' })
  @IsString()
  code: string;
}
