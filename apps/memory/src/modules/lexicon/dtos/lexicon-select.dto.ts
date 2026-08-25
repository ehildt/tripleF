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

export class LexiconSourceDocumentDto {
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
}

export class LexiconSearchResultDto {
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

export class LexiconSelectDto {
  @ApiProperty({
    description: 'Retrieval query the passages are selected against.',
    example: 'What is the capital of France?',
  })
  @IsString()
  query!: string;

  @ApiProperty({
    type: [LexiconSourceDocumentDto],
    description: 'Fetched source documents to select from.',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LexiconSourceDocumentDto)
  documents!: LexiconSourceDocumentDto[];

  @ApiPropertyOptional({
    type: [LexiconSearchResultDto],
    description:
      'Search results seen this turn — indexed as cheap Tier-1 snippet points.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => LexiconSearchResultDto)
  @IsOptional()
  searchResults?: LexiconSearchResultDto[];

  @ApiPropertyOptional({
    description:
      'Selection budget in chars; defaults to the server-side LEXICON_BUDGET_CHARS.',
    example: 48000,
  })
  @IsInt()
  @Min(1000)
  @IsOptional()
  budgetChars?: number;

  @ApiPropertyOptional({
    description:
      'Partition that fetched the documents — provenance on stored chunks (the lexicon is global).',
    example: 'global',
  })
  @IsString()
  @IsOptional()
  partitionScope?: string;
}
