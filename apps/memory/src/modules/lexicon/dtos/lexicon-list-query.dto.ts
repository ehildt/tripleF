import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** All params are optional tightenings on top of the full lexicon listing. */
export class LexiconListQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 500,
    maximum: 1000,
    description: 'Maximum number of chunks (scroll page size, capped at 1000).',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Restrict to one source domain.',
    example: 'example.com',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({
    description: 'Restrict to chunks fetched by one partition (provenance).',
    example: 'global',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  partitionScope?: string;
}
