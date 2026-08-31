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
import Joi from 'joi';

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
import type { QdrantConfig } from '../models/qdrant-config.model.js';

export const QdrantConfigSchema = Joi.object<QdrantConfig>({
  url: Joi.string().uri().optional(),
  apiKey: Joi.string().optional(),
  collection: Joi.string().optional(),
  encyclopediaCollection: Joi.string().optional(),
  vectorSize: Joi.number().integer().positive().optional(),
  embedModel: Joi.string().optional(),
  scoreThreshold: Joi.number().min(0).max(1).optional(),
  embedTimeoutMs: Joi.number().integer().min(1000).optional(),
  enabled: Joi.boolean().optional(),
  // Cognition profile character cap — env baseline for the
  // memoryCognitionLimit system variable (runtime override wins).
  cognitionLimit: Joi.number()
    .integer()
    .min(COGNITION_LIMIT_MIN)
    .max(COGNITION_LIMIT_MAX)
    .optional(),
  // Constellation node-load limit — env baseline for the
  // constellationNodeLimit system variable (runtime override wins).
  constellationNodeLimit: Joi.number()
    .integer()
    .min(CONSTELLATION_NODE_LIMIT_MIN)
    .max(CONSTELLATION_NODE_LIMIT_MAX)
    .optional(),
  consolidateThreshold: Joi.number().integer().min(1).optional(),
  consolidateModel: Joi.string().optional(),
  // Reflection pass — env baselines for the matching system variables
  // (runtime overrides win).
  reflectModel: Joi.string().optional(),
  reflectBatchLimit: Joi.number()
    .integer()
    .min(REFLECT_BATCH_LIMIT_MIN)
    .max(REFLECT_BATCH_LIMIT_MAX)
    .optional(),
  reflectMaxCandidates: Joi.number()
    .integer()
    .min(REFLECT_MAX_CANDIDATES_MIN)
    .max(REFLECT_MAX_CANDIDATES_MAX)
    .optional(),
  partitionReflectAutoEnabled: Joi.boolean().optional(),
  cognitionReflectAutoEnabled: Joi.boolean().optional(),
  encyclopediaReflectAutoEnabled: Joi.boolean().optional(),
  // Conviction-synthesis pass — env baselines for the matching system
  // variables (runtime overrides win).
  convictionModel: Joi.string().optional(),
  convictionBatchLimit: Joi.number()
    .integer()
    .min(CONVICTION_BATCH_LIMIT_MIN)
    .max(CONVICTION_BATCH_LIMIT_MAX)
    .optional(),
  convictionMaxPerCluster: Joi.number()
    .integer()
    .min(CONVICTION_MAX_PER_CLUSTER_MIN)
    .max(CONVICTION_MAX_PER_CLUSTER_MAX)
    .optional(),
  convictionAutoEnabled: Joi.boolean().optional(),
  // Cluster-detection pass — env baselines for the matching system
  // variables (runtime overrides win).
  clusterModel: Joi.string().optional(),
  clusterMinMembers: Joi.number()
    .integer()
    .min(CLUSTER_MIN_MEMBERS_MIN)
    .max(CLUSTER_MIN_MEMBERS_MAX)
    .optional(),
  clusterAutoEnabled: Joi.boolean().optional(),
  // Episode-probe recency blend — env baselines for the matching system
  // variables (runtime overrides win).
  episodeRecencyWeight: Joi.number()
    .min(EPISODE_RECENCY_WEIGHT_MIN)
    .max(EPISODE_RECENCY_WEIGHT_MAX)
    .optional(),
  episodeRecencyScaleSeconds: Joi.number()
    .integer()
    .min(EPISODE_RECENCY_SCALE_SECONDS_MIN)
    .max(EPISODE_RECENCY_SCALE_SECONDS_MAX)
    .optional(),
  episodeRecencyMidpoint: Joi.number()
    .min(EPISODE_RECENCY_MIDPOINT_MIN)
    .max(EPISODE_RECENCY_MIDPOINT_MAX)
    .optional(),
  episodeProbeLimit: Joi.number()
    .integer()
    .min(EPISODE_PROBE_LIMIT_MIN)
    .optional(),
  episodeScoreThreshold: Joi.number()
    .min(EPISODE_SCORE_THRESHOLD_MIN)
    .max(EPISODE_SCORE_THRESHOLD_MAX)
    .optional(),
  // numCtx-derived payload valves (0 = uncapped).
  profilePayloadRatio: Joi.number().min(0).max(1).optional(),
  profilePayloadChars: Joi.number().integer().min(0).optional(),
  vectorizeTextRatio: Joi.number().min(0).max(1).optional(),
  vectorizeTextChars: Joi.number().integer().min(0).optional(),
  // Constellation semantic-link graph knobs.
  linkNeighbors: Joi.number().integer().min(1).max(10).optional(),
  linkScoreThreshold: Joi.number().min(0).max(1).optional(),
  linkTopicalThreshold: Joi.number().min(0).max(1).optional(),
  linkBackfillMaxPoints: Joi.number().integer().min(100).max(50000).optional(),
  linkReadMax: Joi.number().integer().min(100).optional(),
}).required();
