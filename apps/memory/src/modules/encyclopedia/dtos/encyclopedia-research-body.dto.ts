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
 * Encyclopedia research trigger body. The root sweep is global (the
 * encyclopedia is a single scope); follow-up deep-dives are enqueued by the
 * job itself, not through this endpoint.
 */
export class EncyclopediaResearchBodyDto {
  @ApiPropertyOptional({
    description:
      'Chat model for the triage verdicts. Falls back to RESEARCH_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    maximum: 50,
    description: 'Max gaps triaged per run (capped at 50).',
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    maximum: 3,
    description: 'Deep-dive depth to start at (0 = root sweep).',
  })
  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  depth?: number;

  @ApiPropertyOptional({
    description:
      'Log what would be fetched/persisted without applying anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
