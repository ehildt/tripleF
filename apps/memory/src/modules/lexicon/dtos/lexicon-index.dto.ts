import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { LexiconSourceDocumentDto } from './lexicon-select.dto.js';

export class LexiconIndexDto {
  @ApiProperty({
    type: [LexiconSourceDocumentDto],
    description:
      'Documents to index into the shared lexicon (persist-only, no selection).',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LexiconSourceDocumentDto)
  documents!: LexiconSourceDocumentDto[];

  @ApiPropertyOptional({
    description:
      'Partition that uploaded the documents — provenance on stored chunks (the lexicon is global).',
    example: 'global',
  })
  @IsString()
  @IsOptional()
  partitionScope?: string;
}
