import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpsertPlaylistDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    example: [{ videoUrl: 'https://youtu.be/abc', title: 'Some video' }],
  })
  @IsArray()
  videos!: Array<Record<string, unknown>>;
}

export class RenamePlaylistDto {
  @ApiProperty({ example: 'Focus' })
  @IsString()
  @IsNotEmpty()
  newName!: string;
}
