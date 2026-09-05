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
 * Encyclopedia cluster-detection trigger body. The lane is fixed by the
 * controller — this endpoint clusters the global encyclopedia scope only.
 */
export class EncyclopediaClusterBodyDto {
  @ApiPropertyOptional({
    description:
      'Chat model for the summary calls. Falls back to MEMORY_CLUSTER_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 2,
    minimum: 1,
    maximum: 100,
    description: 'Minimum members for a structural cluster (clamped 1–100).',
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  minMembers?: number;

  @ApiPropertyOptional({
    description:
      'Log what would be detected without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
