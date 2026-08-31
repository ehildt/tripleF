import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Conviction search body: the respond-time conviction probe's read path —
 * the AI's own synthesized conclusions about the user/self model (cognition
 * lane), returned with their evidence back-references.
 */
export class MemorySearchConvictionsDto {
  @ApiProperty({
    description: 'Query text; embedded with the configured Ollama model.',
    example: 'What patterns hold true about this user?',
  })
  @IsString()
  text!: string;

  @ApiProperty({
    description: "The AI's cognition space key the convictions belong to.",
    example: 'default',
  })
  @IsString()
  memoryCognition!: string;

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
