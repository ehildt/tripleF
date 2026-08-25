import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  COGNITION_LIMIT_MAX,
  COGNITION_LIMIT_MIN,
  EPISODE_PROBE_LIMIT_MIN,
  EPISODE_RECENCY_MIDPOINT_MAX,
  EPISODE_RECENCY_MIDPOINT_MIN,
  EPISODE_RECENCY_SCALE_SECONDS_MAX,
  EPISODE_RECENCY_SCALE_SECONDS_MIN,
  EPISODE_RECENCY_WEIGHT_MAX,
  EPISODE_RECENCY_WEIGHT_MIN,
  EPISODE_SCORE_THRESHOLD_MAX,
  EPISODE_SCORE_THRESHOLD_MIN,
} from '@triplef/agent/schemas';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import {
  CONSTELLATION_NODE_LIMIT_MAX,
  CONSTELLATION_NODE_LIMIT_MIN,
} from '../constants/constellation-node-limit.constant.js';

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
      'Max episode records injected into the respond context per turn (0–N; 0 disables the probe).',
    example: 3,
    minimum: EPISODE_PROBE_LIMIT_MIN,
  })
  @IsOptional()
  @IsInt()
  @Min(EPISODE_PROBE_LIMIT_MIN)
  episodeProbeLimit?: number;

  @ApiPropertyOptional({
    description:
      'Minimum cosine score for the episode probe recency prefetch (0–1) — the noise floor applied before the recency formula runs.',
    example: 0.1,
    minimum: EPISODE_SCORE_THRESHOLD_MIN,
    maximum: EPISODE_SCORE_THRESHOLD_MAX,
  })
  @IsOptional()
  @IsNumber()
  @Min(EPISODE_SCORE_THRESHOLD_MIN)
  @Max(EPISODE_SCORE_THRESHOLD_MAX)
  episodeScoreThreshold?: number;

  @ApiPropertyOptional({
    description:
      'Max fact records the constellation loads per space (100–10000) — how many dots the memory diagram fetches by default.',
    example: 5000,
    minimum: CONSTELLATION_NODE_LIMIT_MIN,
    maximum: CONSTELLATION_NODE_LIMIT_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(CONSTELLATION_NODE_LIMIT_MIN)
  @Max(CONSTELLATION_NODE_LIMIT_MAX)
  constellationNodeLimit?: number;
}
