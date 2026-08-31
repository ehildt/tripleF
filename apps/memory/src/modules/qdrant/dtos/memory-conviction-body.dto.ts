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
 * Conviction-synthesis trigger body. `memoryPartition` selects the user's
 * fact space to synthesize over; everything else is optional (defaults come
 * from the conviction system variables / env baselines).
 */
export class MemoryConvictionBodyDto {
  @ApiProperty({
    description:
      'The user fact partition to synthesize statements over (curated facts only).',
    example: 'default',
  })
  @IsString()
  memoryPartition!: string;

  @ApiPropertyOptional({
    description:
      "The cognition scope convictions store into — defaults to the partition key (the harness's own cognition-key default).",
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryCognition?: string;

  @ApiPropertyOptional({
    description:
      'Chat model for conviction synthesis. Falls back to MEMORY_CONVICTION_MODEL.',
    example: 'qwen3:8b',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 100,
    maximum: 500,
    description: 'Max evidence points offered per run (capped at 500).',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 5,
    maximum: 20,
    description: 'Max statements emitted per run (capped at 20).',
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxConvictionsPerCluster?: number;

  @ApiPropertyOptional({
    description:
      'Log what would be synthesized without applying or marking anything.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
