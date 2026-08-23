import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import Joi from 'joi';

import type { ProviderEndpointConfig } from './endpoint-config.types.js';

export interface EodhdConfig {
  enabled: boolean;
  apiKey?: string;
  search: ProviderEndpointConfig;
  quote: ProviderEndpointConfig;
  history: ProviderEndpointConfig;
  technical: ProviderEndpointConfig;
  intraday: ProviderEndpointConfig;
  news: ProviderEndpointConfig;
  fundamentals: ProviderEndpointConfig;
}

const endpointSchema = Joi.object<ProviderEndpointConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(1000).required(),
});

export const EodhdConfigSchema = Joi.object<EodhdConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  search: endpointSchema.required(),
  quote: endpointSchema.required(),
  history: endpointSchema.required(),
  technical: endpointSchema.required(),
  intraday: endpointSchema.required(),
  news: endpointSchema.required(),
  fundamentals: endpointSchema.required(),
}).required();

export function EodhdConfigAdapter(env = process.env): EodhdConfig {
  return {
    enabled: getBooleanEnv(env.EODHD_ENABLED, false)!,
    apiKey: env.EODHD_API_KEY || undefined,
    search: {
      enabled: getBooleanEnv(env.EODHD_SEARCH_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_SEARCH_RESULTS, 10) as number,
    },
    quote: {
      enabled: getBooleanEnv(env.EODHD_QUOTE_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_QUOTE_RESULTS, 1) as number,
    },
    history: {
      enabled: getBooleanEnv(env.EODHD_HISTORY_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_HISTORY_RESULTS, 250) as number,
    },
    technical: {
      enabled: getBooleanEnv(env.EODHD_TECHNICAL_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_TECHNICAL_RESULTS, 14) as number,
    },
    intraday: {
      enabled: getBooleanEnv(env.EODHD_INTRADAY_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_INTRADAY_RESULTS, 30) as number,
    },
    news: {
      enabled: getBooleanEnv(env.EODHD_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_NEWS_RESULTS, 10) as number,
    },
    fundamentals: {
      enabled: getBooleanEnv(env.EODHD_FUNDAMENTALS_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_FUNDAMENTALS_RESULTS, 1) as number,
    },
  };
}
