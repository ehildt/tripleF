import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

export interface BrowserBaseConfig {
  enabled: boolean;
  apiKey?: string;
  projectId?: string;
  search: { enabled: boolean; results: number };
  fetch: {
    enabled: boolean;
    format: 'raw' | 'markdown' | 'json';
    proxies: boolean;
  };
}

export const BrowserBaseConfigSchema = Joi.object<BrowserBaseConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  projectId: Joi.string().optional(),
  search: Joi.object({
    enabled: Joi.boolean().required(),
    results: Joi.number().integer().min(1).max(25).required(),
  }).required(),
  fetch: Joi.object({
    enabled: Joi.boolean().required(),
    format: Joi.string().valid('raw', 'markdown', 'json').required(),
    proxies: Joi.boolean().required(),
  }).required(),
}).required();

export function BrowserBaseConfigAdapter(env = process.env): BrowserBaseConfig {
  return {
    enabled: getBooleanEnv(env.BROWSER_BASE_ENABLED, false)!,
    apiKey: env.BROWSER_BASE_API_KEY || undefined,
    projectId: env.BROWSER_PROJECT_ID || undefined,
    search: {
      enabled: getBooleanEnv(env.BROWSER_BASE_ENABLED, false)!,
      results: getNumberEnv(env.BROWSER_BASE_RESULTS, 10) as number,
    },
    fetch: {
      enabled: getBooleanEnv(env.BROWSER_BASE_FETCH_ENABLED, false)!,
      format: (env.BROWSER_BASE_FETCH_FORMAT || 'markdown') as
        'raw' | 'markdown' | 'json',
      proxies: getBooleanEnv(env.BROWSER_BASE_FETCH_PROXIES, false)!,
    },
  };
}
