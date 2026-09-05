import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EncyclopediaSearchDto {
  @ApiProperty({
    description:
      'Natural-language question or keywords to search the knowledge base for.',
    example: 'receipt hardware store march',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description:
      'Restrict the search to ONE document — the exact url of a stored source (uploaded documents carry their storage url).',
    example: 'https://example.com/article',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    description: 'Restrict the search to one source domain.',
    example: 'reddit.com',
  })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Max hits returned (default 5, capped at 10).',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
