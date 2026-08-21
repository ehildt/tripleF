import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';

import {
  clampCognitionLimit,
  COGNITION_LIMIT_DEFAULT,
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
  };
}
