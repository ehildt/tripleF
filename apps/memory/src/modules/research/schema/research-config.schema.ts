import Joi from 'joi';

import type { ResearchConfig } from '../models/research-config.model.js';

export const ResearchConfigSchema = Joi.object<ResearchConfig>({
  enabled: Joi.boolean().optional(),
  searchEnabled: Joi.boolean().optional(),
  provider: Joi.string().valid('serper', 'bright-data').optional(),
  model: Joi.string().optional(),
  gapLimit: Joi.number().integer().min(1).max(50).optional(),
  maxDepth: Joi.number().integer().min(1).max(3).optional(),
  fetchBudget: Joi.number().integer().min(1).max(20).optional(),
  frictionLimit: Joi.number().integer().min(1).max(20).optional(),
  serper: Joi.object({
    enabled: Joi.boolean().optional(),
    apiKey: Joi.string().optional(),
    web: Joi.object({
      enabled: Joi.boolean().optional(),
      results: Joi.number().integer().min(1).max(100).optional(),
    }).optional(),
  }).optional(),
  brightData: Joi.object({
    enabled: Joi.boolean().optional(),
    apiKey: Joi.string().optional(),
    serpZone: Joi.string().optional(),
    web: Joi.object({
      enabled: Joi.boolean().optional(),
      results: Joi.number().integer().min(1).max(100).optional(),
    }).optional(),
  }).optional(),
}).required();
