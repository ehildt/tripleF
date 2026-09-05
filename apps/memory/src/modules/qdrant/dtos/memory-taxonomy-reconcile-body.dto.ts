import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Taxonomy reconciliation trigger body (partition lane): the label-merge
 * sweep over the partition's registry — cluster/community/hub/tag tiers.
 */
export class MemoryTaxonomyReconcileBodyDto {
  @ApiProperty({
    description: 'The fact partition whose taxonomy is reconciled.',
    example: 'default',
  })
  @IsString()
  memoryPartition!: string;

  @ApiPropertyOptional({
    description:
      'Adjudication model for the ambiguous-band verdicts; falls back to MEMORY_CONSOLIDATE_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max candidate pairs processed per run (capped at 500).',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Compute and log merge decisions without applying anything.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
