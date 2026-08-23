import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  COGNITION_LIMIT_MAX,
  COGNITION_LIMIT_MIN,
} from '../models/memory-cognition.model.js';

export class MemoryOverridesDto {
  @ApiPropertyOptional({
    description:
      "Cognition profile character cap (serialized JSON size) — how long the AI's structured understanding of the user may grow. Clamped 500–32000; omit to keep the current value.",
    example: 5000,
    minimum: COGNITION_LIMIT_MIN,
    maximum: COGNITION_LIMIT_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(COGNITION_LIMIT_MIN)
  @Max(COGNITION_LIMIT_MAX)
  cognitionLimit?: number;
}
