import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddPlaylistDto {
  @IsNotEmpty()
  @IsString()
  playlistUrl: string;

  @IsOptional()
  @IsString()
  explanation: string;

  @IsArray()
  genres: number[];
}
