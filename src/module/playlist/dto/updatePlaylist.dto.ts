import { PartialType, PickType } from '@nestjs/mapped-types';
import { AddPlaylistDto } from './addPlaylist.dto';

export class UpdatePlaylistDto extends PartialType(
  PickType(AddPlaylistDto, ['explanation', 'genres'] as const),
) {}
