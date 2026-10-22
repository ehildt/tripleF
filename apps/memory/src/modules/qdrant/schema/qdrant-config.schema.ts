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
import { z } from 'zod';

import {
  CLUSTER_MIN_MEMBERS_MAX,
  CLUSTER_MIN_MEMBERS_MIN,
  RAPTOR_MAX_DEPTH_MAX,
  RAPTOR_MAX_DEPTH_MIN,
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

export const QdrantConfigSchema = z.strictObject({
  url: z.url().optional(),
  apiKey: z.string().optional(),
  collection: z.string().optional(),
  encyclopediaCollection: z.string().optional(),
  vectorSize: z.number().int().positive().optional(),
  embedModel: z.string().optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
  embedTimeoutMs: z.number().int().min(1000).optional(),
  enabled: z.boolean().optional(),
  // Cognition profile character cap — env baseline for the
  // memoryCognitionLimit system variable (runtime override wins).
  cognitionLimit: z
    .number()
    .int()
    .min(COGNITION_LIMIT_MIN)
    .max(COGNITION_LIMIT_MAX)
    .optional(),
  // Constellation node-load limit — env baseline for the
  // constellationNodeLimit system variable (runtime override wins).
  constellationNodeLimit: z
    .number()
    .int()
    .min(CONSTELLATION_NODE_LIMIT_MIN)
    .max(CONSTELLATION_NODE_LIMIT_MAX)
    .optional(),
  consolidateThreshold: z.number().int().min(1).optional(),
  consolidateModel: z.string().optional(),
  // Reflection pass — env baselines for the matching system variables
  // (runtime overrides win).
  reflectModel: z.string().optional(),
  reflectBatchLimit: z
    .number()
    .int()
    .min(REFLECT_BATCH_LIMIT_MIN)
    .max(REFLECT_BATCH_LIMIT_MAX)
    .optional(),
  reflectMaxCandidates: z
    .number()
    .int()
    .min(REFLECT_MAX_CANDIDATES_MIN)
    .max(REFLECT_MAX_CANDIDATES_MAX)
    .optional(),
  partitionReflectAutoEnabled: z.boolean().optional(),
  cognitionReflectAutoEnabled: z.boolean().optional(),
  encyclopediaReflectAutoEnabled: z.boolean().optional(),
  // Conviction-synthesis pass — env baselines for the matching system
  // variables (runtime overrides win).
  convictionModel: z.string().optional(),
  convictionBatchLimit: z
    .number()
    .int()
    .min(CONVICTION_BATCH_LIMIT_MIN)
    .max(CONVICTION_BATCH_LIMIT_MAX)
    .optional(),
  convictionMaxPerCluster: z
    .number()
    .int()
    .min(CONVICTION_MAX_PER_CLUSTER_MIN)
    .max(CONVICTION_MAX_PER_CLUSTER_MAX)
    .optional(),
  convictionAutoEnabled: z.boolean().optional(),
  // Cluster-detection pass — env baselines for the matching system
  // variables (runtime overrides win).
  clusterModel: z.string().optional(),
  clusterMinMembers: z
    .number()
    .int()
    .min(CLUSTER_MIN_MEMBERS_MIN)
    .max(CLUSTER_MIN_MEMBERS_MAX)
    .optional(),
  clusterAutoEnabled: z.boolean().optional(),
  raptorEnabled: z.boolean().optional(),
  heatTrackingEnabled: z.boolean().optional(),
  raptorMaxDepth: z
    .number()
    .int()
    .min(RAPTOR_MAX_DEPTH_MIN)
    .max(RAPTOR_MAX_DEPTH_MAX)
    .optional(),
  // Episode-probe recency blend — env baselines for the matching system
  // variables (runtime overrides win).
  episodeRecencyWeight: z
    .number()
    .min(EPISODE_RECENCY_WEIGHT_MIN)
    .max(EPISODE_RECENCY_WEIGHT_MAX)
    .optional(),
  episodeRecencyScaleSeconds: z
    .number()
    .int()
    .min(EPISODE_RECENCY_SCALE_SECONDS_MIN)
    .max(EPISODE_RECENCY_SCALE_SECONDS_MAX)
    .optional(),
  episodeRecencyMidpoint: z
    .number()
    .min(EPISODE_RECENCY_MIDPOINT_MIN)
    .max(EPISODE_RECENCY_MIDPOINT_MAX)
    .optional(),
  episodeProbeLimit: z.number().int().min(EPISODE_PROBE_LIMIT_MIN).optional(),
  episodeScoreThreshold: z
    .number()
    .min(EPISODE_SCORE_THRESHOLD_MIN)
    .max(EPISODE_SCORE_THRESHOLD_MAX)
    .optional(),
  // numCtx-derived payload valves (0 = uncapped).
  profilePayloadRatio: z.number().min(0).max(1).optional(),
  profilePayloadChars: z.number().int().min(0).optional(),
  vectorizeTextRatio: z.number().min(0).max(1).optional(),
  vectorizeTextChars: z.number().int().min(0).optional(),
  // Constellation semantic-link graph knobs.
  linkNeighbors: z.number().int().min(1).max(10).optional(),
  linkScoreThreshold: z.number().min(0).max(1).optional(),
  linkTopicalThreshold: z.number().min(0).max(1).optional(),
  linkBackfillMaxPoints: z.number().int().min(100).max(50_000).optional(),
  linkReadMax: z.number().int().min(100).optional(),
  // Hybrid retrieval (dense + sparse fused): enable switch, fusion method,
  // RRF leg weights, and the sparse prefetch depth.
  hybridEnabled: z.boolean().optional(),
  hybridFusion: z.enum(['rrf', 'dbsf']).optional(),
  hybridDenseWeight: z.number().min(0).optional(),
  hybridSparseWeight: z.number().min(0).optional(),
  hybridSparseLimit: z.number().int().min(1).max(1000).optional(),
});
