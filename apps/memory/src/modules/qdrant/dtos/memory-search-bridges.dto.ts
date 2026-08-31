import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Bridge search body: the synthesized gap-closer read path. Bridges are
 * excluded from the fact recall path (search/text) so a synthesized inference
 * is never attributed as a user statement; this surface returns them with
 * their evidence back-references.
 */
export class MemorySearchBridgesDto {
  @ApiProperty({
    description: 'Query text; embedded with the configured Ollama model.',
    example: 'What is the user migrating to Rust?',
  })
  @IsString()
  text!: string;

  @ApiProperty({
    description: "The user's fact partition the bridges belong to.",
    example: 'default',
  })
  @IsString()
  memoryPartition!: string;

  @ApiPropertyOptional({
    type: Number,
    default: 5,
    maximum: 5,
    description: 'Maximum number of results (capped at 5).',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  limit?: number;
}
