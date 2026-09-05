import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

/** Query params for the vocabulary facet endpoint. */
export class MemoryVocabularyQueryDto {
  @ApiPropertyOptional({
    description: 'Memory partition to list facets for.',
    example: 'default',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  memoryPartition?: string;
}
