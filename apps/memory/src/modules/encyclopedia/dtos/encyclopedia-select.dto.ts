import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class EncyclopediaSourceDocumentDto {
  @ApiPropertyOptional({
    description: 'Source URL of the document.',
    example: 'https://example.com/article',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    description: 'Source title.',
    example: 'Article title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Full text content of the document.',
    example: 'The article body…',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: 'Mime type of the original upload (uploaded documents only).',
    example: 'application/pdf',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Byte size of the original upload (uploaded documents only).',
    example: 245760,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sizeBytes?: number;

  @ApiPropertyOptional({
    description:
      'Content hash of the ORIGINAL upload — the MinIO object identity (uploaded documents only).',
    example: 'a3b2c1',
  })
  @IsString()
  @IsOptional()
  originalHash?: string;
}

export class EncyclopediaSearchResultDto {
  @ApiProperty({
    description: 'Result URL.',
    example: 'https://example.com/article',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    description: 'Result title.',
    example: 'Article title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Search-result snippet (indexed as a Tier-1 point).',
    example: 'The result snippet…',
  })
  @IsString()
  snippet!: string;
}

export class EncyclopediaSelectDto {
  @ApiProperty({
    description: 'Retrieval query the passages are selected against.',
    example: 'What is the capital of France?',
  })
  @IsString()
  query!: string;

  @ApiProperty({
    type: [EncyclopediaSourceDocumentDto],
    description: 'Fetched source documents to select from.',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EncyclopediaSourceDocumentDto)
  documents!: EncyclopediaSourceDocumentDto[];

  @ApiPropertyOptional({
    type: [EncyclopediaSearchResultDto],
    description:
      'Search results seen this turn — indexed as cheap Tier-1 snippet points.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EncyclopediaSearchResultDto)
  @IsOptional()
  searchResults?: EncyclopediaSearchResultDto[];

  @ApiPropertyOptional({
    description:
      'Selection budget in chars; defaults to the server-side ENCYCLOPEDIA_BUDGET_CHARS.',
    example: 48000,
  })
  @IsInt()
  @Min(1000)
  @IsOptional()
  budgetChars?: number;

  @ApiPropertyOptional({
    description:
      'Partition that fetched the documents — provenance on stored chunks (the encyclopedia is global).',
    example: 'global',
  })
  @IsString()
  @IsOptional()
  partitionScope?: string;

  @ApiPropertyOptional({
    description:
      "The turn's chat model — threaded to the classification job when the select call crosses the classify threshold, so classification can run without a dedicated ENCYCLOPEDIA_CLASSIFY_MODEL.",
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;
}
