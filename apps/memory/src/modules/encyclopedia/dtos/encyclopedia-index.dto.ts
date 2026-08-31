import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { EncyclopediaSourceDocumentDto } from './encyclopedia-select.dto.js';

export class EncyclopediaIndexDto {
  @ApiProperty({
    type: [EncyclopediaSourceDocumentDto],
    description:
      'Documents to index into the shared encyclopedia (persist-only, no selection).',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EncyclopediaSourceDocumentDto)
  documents!: EncyclopediaSourceDocumentDto[];

  @ApiPropertyOptional({
    description:
      'Partition that uploaded the documents — provenance on stored chunks (the encyclopedia is global).',
    example: 'global',
  })
  @IsString()
  @IsOptional()
  partitionScope?: string;
}
