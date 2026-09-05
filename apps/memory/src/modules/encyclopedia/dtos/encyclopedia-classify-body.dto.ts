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
 * Encyclopedia classification trigger body. Everything is optional — the job is
 * global (the encyclopedia is shared) and labels documents with category + topic.
 */
export class EncyclopediaClassifyBodyDto {
  @ApiPropertyOptional({
    description:
      'Chat model for the classification calls. Falls back to ENCYCLOPEDIA_CLASSIFY_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

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
      'Log what would be labeled without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
