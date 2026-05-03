import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

export interface SearXNGConfig {
  url?: string;
  enabled: boolean;
  results: number;
}

export const SearXNGConfigSchema = Joi.object<SearXNGConfig>({
  url: Joi.string().uri().optional(),
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(200).required(),
}).required();

export function SearXNGConfigAdapter(env = process.env): SearXNGConfig {
  return {
    url: env.SEARCH_URL || undefined,
    enabled: getBooleanEnv(env.SEARXNG_ENABLED, true)!,
    results: getNumberEnv(env.SEARXNG_RESULTS, 10) as number,
  };
}
