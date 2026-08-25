import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import {
  COGNITION_LIMIT_MAX,
  COGNITION_LIMIT_MIN,
  EPISODE_PROBE_LIMIT_MAX,
  EPISODE_PROBE_LIMIT_MIN,
  EPISODE_RECENCY_MIDPOINT_MAX,
  EPISODE_RECENCY_MIDPOINT_MIN,
  EPISODE_RECENCY_SCALE_SECONDS_MAX,
  EPISODE_RECENCY_SCALE_SECONDS_MIN,
  EPISODE_RECENCY_WEIGHT_MAX,
  EPISODE_RECENCY_WEIGHT_MIN,
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

  @ApiPropertyOptional({
    description:
      'Recency weight for the episode probe (0–1) — how much recency may break topical ties in the short-term conversation-memory ranking.',
    example: 0.3,
    minimum: EPISODE_RECENCY_WEIGHT_MIN,
    maximum: EPISODE_RECENCY_WEIGHT_MAX,
  })
  @IsOptional()
  @IsNumber()
  @Min(EPISODE_RECENCY_WEIGHT_MIN)
  @Max(EPISODE_RECENCY_WEIGHT_MAX)
  episodeRecencyWeight?: number;

  @ApiPropertyOptional({
    description:
      'Recency decay horizon in seconds (60–31536000) — an episode this old loses half its recency bonus.',
    example: 604800,
    minimum: EPISODE_RECENCY_SCALE_SECONDS_MIN,
    maximum: EPISODE_RECENCY_SCALE_SECONDS_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(EPISODE_RECENCY_SCALE_SECONDS_MIN)
  @Max(EPISODE_RECENCY_SCALE_SECONDS_MAX)
  episodeRecencyScaleSeconds?: number;

  @ApiPropertyOptional({
    description: 'Recency decay midpoint (0.01–0.99).',
    example: 0.5,
    minimum: EPISODE_RECENCY_MIDPOINT_MIN,
    maximum: EPISODE_RECENCY_MIDPOINT_MAX,
  })
  @IsOptional()
  @IsNumber()
  @Min(EPISODE_RECENCY_MIDPOINT_MIN)
  @Max(EPISODE_RECENCY_MIDPOINT_MAX)
  episodeRecencyMidpoint?: number;

  @ApiPropertyOptional({
    description:
      'Max episode records injected into the respond context per turn (1–10).',
    example: 3,
    minimum: EPISODE_PROBE_LIMIT_MIN,
    maximum: EPISODE_PROBE_LIMIT_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(EPISODE_PROBE_LIMIT_MIN)
  @Max(EPISODE_PROBE_LIMIT_MAX)
  episodeProbeLimit?: number;
}
