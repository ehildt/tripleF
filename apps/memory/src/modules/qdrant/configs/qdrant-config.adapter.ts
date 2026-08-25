import {
  clampCognitionLimit,
  clampEpisodeProbeLimit,
  clampEpisodeRecencyMidpoint,
  clampEpisodeRecencyScaleSeconds,
  clampEpisodeRecencyWeight,
  clampEpisodeScoreThreshold,
  COGNITION_LIMIT_DEFAULT,
  EPISODE_PROBE_LIMIT_DEFAULT,
  EPISODE_RECENCY_MIDPOINT_DEFAULT,
  EPISODE_RECENCY_SCALE_SECONDS_DEFAULT,
  EPISODE_RECENCY_WEIGHT_DEFAULT,
  EPISODE_SCORE_THRESHOLD_DEFAULT,
} from '@triplef/agent/schemas';
import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';

import {
  clampConstellationNodeLimit,
  CONSTELLATION_NODE_LIMIT_DEFAULT,
} from '../constants/constellation-node-limit.constant.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

export function QdrantConfigAdapter(env = process.env): QdrantConfig {
  return {
    url: env.QDRANT_URL ?? 'http://qdrant:6333',
    apiKey: env.QDRANT_API_KEY || undefined,
    collection: env.QDRANT_COLLECTION ?? 'harness_memory',
    lexiconCollection: env.LEXICON_COLLECTION ?? 'memory-lexicon',
    vectorSize: getNumberEnv(env.QDRANT_VECTOR_SIZE, 768) as number,
    embedModel: env.QDRANT_EMBED_MODEL ?? 'nomic-embed-text-v2-moe',
    scoreThreshold: getNumberEnv(env.QDRANT_SCORE_THRESHOLD, 0.3) as number,
    embedTimeoutMs: getNumberEnv(env.QDRANT_EMBED_TIMEOUT_MS, 60_000) as number,
    enabled: getBooleanEnv(env.MEMORY_ENABLED, true)!,
    cognitionLimit: clampCognitionLimit(
      getNumberEnv(
        env.MEMORY_COGNITION_LIMIT,
        COGNITION_LIMIT_DEFAULT,
      ) as number,
    ),
    constellationNodeLimit: clampConstellationNodeLimit(
      getNumberEnv(
        env.MEMORY_CONSTELLATION_NODE_LIMIT,
        CONSTELLATION_NODE_LIMIT_DEFAULT,
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
    episodeScoreThreshold: clampEpisodeScoreThreshold(
      getNumberEnv(
        env.MEMORY_EPISODE_SCORE_THRESHOLD,
        EPISODE_SCORE_THRESHOLD_DEFAULT,
      ) as number,
    ),
    profilePayloadRatio: getNumberEnv(
      env.MEMORY_PROFILE_PAYLOAD_RATIO,
      0.5,
    ) as number,
    profilePayloadChars: getNumberEnv(
      env.MEMORY_PROFILE_PAYLOAD_CHARS,
      0,
    ) as number,
    vectorizeTextRatio: getNumberEnv(
      env.MEMORY_VECTORIZE_TEXT_RATIO,
      0.5,
    ) as number,
    vectorizeTextChars: getNumberEnv(
      env.MEMORY_VECTORIZE_TEXT_CHARS,
      0,
    ) as number,
    linkNeighbors: getNumberEnv(env.MEMORY_LINK_NEIGHBORS, 3) as number,
    // Default calibrated against the live partition data embedded with
    // nomic-embed-text-v2-moe: unrelated cross-topic pairs score 0.51–0.55
    // (the anisotropy floor of nomic-family embedders), genuine same-topic
    // pairs 0.68–0.91 — so 0.5 meant "any nearest neighbor" and 0.7 is the
    // bar where a link means actual relatedness.
    linkScoreThreshold: getNumberEnv(
      env.MEMORY_LINK_SCORE_THRESHOLD,
      0.7,
    ) as number,
    // Topical (suggested) edges sit below the semantic bar but above the
    // nomic anisotropy noise floor (0.51–0.55) — 0.6 catches the weaker
    // same-topic pairs the semantic threshold rejects.
    linkTopicalThreshold: getNumberEnv(
      env.MEMORY_LINK_TOPICAL_THRESHOLD,
      0.6,
    ) as number,
    linkBackfillMaxPoints: getNumberEnv(
      env.MEMORY_LINK_BACKFILL_MAX_POINTS,
      5000,
    ) as number,
    linkReadMax: getNumberEnv(env.MEMORY_LINK_READ_MAX, 50000) as number,
  };
}
