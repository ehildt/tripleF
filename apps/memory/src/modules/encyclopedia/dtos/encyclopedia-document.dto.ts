import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EncyclopediaDocumentDto {
  @ApiProperty({
    description: 'Exact url of the stored document to read.',
    example: 'https://example.com/article',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Chunk index to start reading from (default 0).',
    example: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Max chars of the returned content window (default 12000, capped at 48000).',
    example: 12000,
  })
  @IsInt()
  @Min(1000)
  @IsOptional()
  maxChars?: number;
}
