import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Lexicon supersede sweep trigger body. Everything is optional — the sweep is
 * global (the lexicon is shared) and deterministic (no model).
 */
export class LexiconConsolidateBodyDto {
  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max pending documents processed per run (capped at 500).',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Log what would be healed without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
