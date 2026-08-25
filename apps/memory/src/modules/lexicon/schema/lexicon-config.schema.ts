import Joi from 'joi';

import type { LexiconConfig } from '../models/lexicon-config.model.js';

export const LexiconConfigSchema = Joi.object<LexiconConfig>({
  selectEnabled: Joi.boolean().optional(),
  budgetChars: Joi.number().integer().min(1000).max(500_000).optional(),
  chunkChars: Joi.number().integer().min(200).max(8000).optional(),
  chunkOverlapSentences: Joi.number().integer().min(0).max(3).optional(),
  scoreThreshold: Joi.number().min(0).max(1).optional(),
  maxChunks: Joi.number().integer().min(16).max(4000).optional(),
  persistEnabled: Joi.boolean().optional(),
  probeLimit: Joi.number().integer().min(1).max(20).optional(),
  neighborExpansion: Joi.number().integer().min(0).max(3).optional(),
  maxDocumentChars: Joi.number()
    .integer()
    .min(100_000)
    .max(16_000_000)
    .optional(),
  consolidateThreshold: Joi.number().integer().min(1).optional(),
}).required();
