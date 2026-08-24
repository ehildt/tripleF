import Joi from 'joi';

import {
  COGNITION_LIMIT_MAX,
  COGNITION_LIMIT_MIN,
} from '../models/memory-cognition.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

export const QdrantConfigSchema = Joi.object<QdrantConfig>({
  url: Joi.string().uri().optional(),
  apiKey: Joi.string().optional(),
  collection: Joi.string().optional(),
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
  consolidateThreshold: Joi.number().integer().min(1).optional(),
  consolidateModel: Joi.string().optional(),
}).required();
