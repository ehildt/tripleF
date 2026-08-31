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
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  CLUSTER_MIN_MEMBERS_MAX,
  CLUSTER_MIN_MEMBERS_MIN,
} from '../constants/cluster.constant.js';
import {
  CONSTELLATION_NODE_LIMIT_MAX,
  CONSTELLATION_NODE_LIMIT_MIN,
} from '../constants/constellation-node-limit.constant.js';
import {
  CONVICTION_BATCH_LIMIT_MAX,
  CONVICTION_BATCH_LIMIT_MIN,
  CONVICTION_MAX_PER_CLUSTER_MAX,
  CONVICTION_MAX_PER_CLUSTER_MIN,
} from '../constants/conviction.constant.js';
import {
  REFLECT_BATCH_LIMIT_MAX,
  REFLECT_BATCH_LIMIT_MIN,
  REFLECT_MAX_CANDIDATES_MAX,
  REFLECT_MAX_CANDIDATES_MIN,
} from '../constants/reflect.constant.js';

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

  @ApiPropertyOptional({
    description:
      'Auto-trigger reflection after a partition consolidation sweep.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  partitionReflectAutoEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-trigger reflection after a cognition profile job.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  cognitionReflectAutoEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Auto-trigger reflection after the encyclopedia classification job.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  encyclopediaReflectAutoEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Chat model for the reflection pass friction verdicts (overrides MEMORY_REFLECT_MODEL).',
    example: 'qwen3:8b',
  })
  @IsOptional()
  @IsString()
  reflectModel?: string;

  @ApiPropertyOptional({
    description: 'Max unreflected points screened per reflection run (1–500).',
    example: 100,
    minimum: REFLECT_BATCH_LIMIT_MIN,
    maximum: REFLECT_BATCH_LIMIT_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(REFLECT_BATCH_LIMIT_MIN)
  @Max(REFLECT_BATCH_LIMIT_MAX)
  reflectBatchLimit?: number;

  @ApiPropertyOptional({
    description:
      'Max near-neighbor candidates per point in the friction screen (1–100).',
    example: 5,
    minimum: REFLECT_MAX_CANDIDATES_MIN,
    maximum: REFLECT_MAX_CANDIDATES_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(REFLECT_MAX_CANDIDATES_MIN)
  @Max(REFLECT_MAX_CANDIDATES_MAX)
  reflectMaxCandidates?: number;

  @ApiPropertyOptional({
    description:
      'Chat model for the conviction-synthesis pass (overrides MEMORY_CONVICTION_MODEL).',
    example: 'qwen3:8b',
  })
  @IsOptional()
  @IsString()
  convictionModel?: string;

  @ApiPropertyOptional({
    description:
      'Max evidence points offered per conviction-synthesis run (1–500).',
    example: 100,
    minimum: CONVICTION_BATCH_LIMIT_MIN,
    maximum: CONVICTION_BATCH_LIMIT_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(CONVICTION_BATCH_LIMIT_MIN)
  @Max(CONVICTION_BATCH_LIMIT_MAX)
  convictionBatchLimit?: number;

  @ApiPropertyOptional({
    description:
      'Max convictions written per cluster per conviction-synthesis run (1–1000).',
    example: 5,
    minimum: CONVICTION_MAX_PER_CLUSTER_MIN,
    maximum: CONVICTION_MAX_PER_CLUSTER_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(CONVICTION_MAX_PER_CLUSTER_MIN)
  @Max(CONVICTION_MAX_PER_CLUSTER_MAX)
  convictionMaxPerCluster?: number;

  @ApiPropertyOptional({
    description:
      'Auto-trigger conviction synthesis after a partition reflection sweep.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  convictionAutoEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Chat model for the cluster-detection summarization pass (overrides MEMORY_CLUSTER_MODEL).',
    example: 'qwen3:8b',
  })
  @IsOptional()
  @IsString()
  clusterModel?: string;

  @ApiPropertyOptional({
    description:
      'Chat model for the partition consolidation sweep (overrides MEMORY_CONSOLIDATE_MODEL).',
    example: 'qwen3:8b',
  })
  @IsOptional()
  @IsString()
  consolidateModel?: string;

  @ApiPropertyOptional({
    description:
      'Chat model for the encyclopedia classification job (overrides ENCYCLOPEDIA_CLASSIFY_MODEL).',
    example: 'qwen3:8b',
  })
  @IsOptional()
  @IsString()
  classifyModel?: string;

  @ApiPropertyOptional({
    description: 'Minimum members for a structural cluster (1–100).',
    example: 2,
    minimum: CLUSTER_MIN_MEMBERS_MIN,
    maximum: CLUSTER_MIN_MEMBERS_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(CLUSTER_MIN_MEMBERS_MIN)
  @Max(CLUSTER_MIN_MEMBERS_MAX)
  clusterMinMembers?: number;

  @ApiPropertyOptional({
    description:
      'Auto-trigger cluster detection after a lane graph-mutating job.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  clusterAutoEnabled?: boolean;
}
