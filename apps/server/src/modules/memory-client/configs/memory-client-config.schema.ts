import Joi from 'joi';

import type { MemoryClientConfig } from './memory-client-config.adapter.js';

export const MemoryClientConfigSchema = Joi.object<MemoryClientConfig>({
  url: Joi.string().uri().optional(),
  enabled: Joi.boolean().optional(),
}).required();
