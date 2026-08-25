import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** Query-string numbers arrive as strings — convert, keeping undefined. */
const parseNumber = ({ value }: { value: unknown }): number | undefined =>
  value === undefined ? undefined : Number(value);

/** Query-string booleans arrive as 'true'/'false' strings — convert. */
const parseBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

/**
 * Relink sweep trigger query. `memoryPartition` is required (the sweep is
 * one partition's category-aware consolidation); everything else is optional
 * with safe defaults. `enrich` is off by default — tags are the recall filter
 * vocabulary, so refining them changes future tag-filtered recall.
 */
export class MemoryRelinkQueryDto {
  @ApiProperty({
    description: "The user's fact partition to relink.",
    example: 'christopher',
  })
  @IsString()
  memoryPartition!: string;

  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max points processed per category per pass (capped at 500).',
  })
  @Transform(parseNumber)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 3,
    maximum: 10,
    description:
      'Max full passes over the categories before stopping (capped at 10).',
  })
  @Transform(parseNumber)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxPasses?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      "Also refine each point's tags via LLM (off by default — tags are the recall filter vocabulary).",
    example: false,
  })
  @Transform(parseBoolean)
  @IsBoolean()
  @IsOptional()
  enrich?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Compute and log verdicts/edges without applying anything.',
    example: true,
  })
  @Transform(parseBoolean)
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
