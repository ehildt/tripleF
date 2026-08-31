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
 * Encyclopedia reflection trigger body. The lane is fixed by the controller —
 * this endpoint reflects the global encyclopedia scope only.
 */
export class EncyclopediaReflectBodyDto {
  @ApiPropertyOptional({
    description:
      'Chat model for the friction verdicts. Falls back to MEMORY_REFLECT_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max unreflected points screened per run (capped at 500).',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Log what would be screened without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
