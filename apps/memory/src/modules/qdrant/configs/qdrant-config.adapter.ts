import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';

import {
  clampCognitionLimit,
  clampEpisodeProbeLimit,
  clampEpisodeRecencyMidpoint,
  clampEpisodeRecencyScaleSeconds,
  clampEpisodeRecencyWeight,
  COGNITION_LIMIT_DEFAULT,
  EPISODE_PROBE_LIMIT_DEFAULT,
  EPISODE_RECENCY_MIDPOINT_DEFAULT,
  EPISODE_RECENCY_SCALE_SECONDS_DEFAULT,
  EPISODE_RECENCY_WEIGHT_DEFAULT,
} from '../models/memory-cognition.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

export function QdrantConfigAdapter(env = process.env): QdrantConfig {
  return {
    url: env.QDRANT_URL ?? 'http://qdrant:6333',
    apiKey: env.QDRANT_API_KEY || undefined,
    collection: env.QDRANT_COLLECTION ?? 'harness_memory',
    vectorSize: getNumberEnv(env.QDRANT_VECTOR_SIZE, 768) as number,
    embedModel: env.QDRANT_EMBED_MODEL ?? 'nomic-embed-text-v2-moe',
    scoreThreshold: getNumberEnv(env.QDRANT_SCORE_THRESHOLD, 0.5) as number,
    embedTimeoutMs: getNumberEnv(env.QDRANT_EMBED_TIMEOUT_MS, 60_000) as number,
    enabled: getBooleanEnv(env.MEMORY_ENABLED, false)!,
    cognitionLimit: clampCognitionLimit(
      getNumberEnv(
        env.MEMORY_COGNITION_LIMIT,
        COGNITION_LIMIT_DEFAULT,
      ) as number,
    ),
    consolidateThreshold: getNumberEnv(
      env.MEMORY_CONSOLIDATE_THRESHOLD,
      50,
    ) as number,
    consolidateModel: env.MEMORY_CONSOLIDATE_MODEL || undefined,
    episodeRecencyWeight: clampEpisodeRecencyWeight(
      getNumberEnv(
        env.MEMORY_EPISODE_RECENCY_WEIGHT,
        EPISODE_RECENCY_WEIGHT_DEFAULT,
      ) as number,
    ),
    episodeRecencyScaleSeconds: clampEpisodeRecencyScaleSeconds(
      getNumberEnv(
        env.MEMORY_EPISODE_RECENCY_SCALE_SECONDS,
        EPISODE_RECENCY_SCALE_SECONDS_DEFAULT,
      ) as number,
    ),
    episodeRecencyMidpoint: clampEpisodeRecencyMidpoint(
      getNumberEnv(
        env.MEMORY_EPISODE_RECENCY_MIDPOINT,
        EPISODE_RECENCY_MIDPOINT_DEFAULT,
      ) as number,
    ),
    episodeProbeLimit: clampEpisodeProbeLimit(
      getNumberEnv(
        env.MEMORY_EPISODE_PROBE_LIMIT,
        EPISODE_PROBE_LIMIT_DEFAULT,
      ) as number,
    ),
  };
}
