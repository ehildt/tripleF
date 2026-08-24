import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Consolidation sweep trigger body. Everything is optional: omit
 * `memoryPartition` to sweep every partition with pending inserts; `model`
 * falls back to MEMORY_CONSOLIDATE_MODEL.
 */
export class MemoryConsolidateBodyDto {
  @ApiPropertyOptional({
    description:
      'Sweep one partition; omit to sweep every partition with pending inserts.',
    example: 'christopher',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max pending inserts processed per partition (capped at 500).',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Compute and log verdicts without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Adjudication model; falls back to MEMORY_CONSOLIDATE_MODEL.',
    example: 'qwen3.8:27b',
  })
  @IsString()
  @IsOptional()
  model?: string;
}
