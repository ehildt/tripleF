import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import Joi from 'joi';

import type { ProviderEndpointConfig } from './endpoint-config.types.js';

export interface EodhdNewsConfig extends ProviderEndpointConfig {
  /** Optional news-body cap (chars); 0 = uncapped. */
  snippetChars?: number;
}

export interface EodhdConfig {
  enabled: boolean;
  apiKey?: string;
  search: ProviderEndpointConfig;
  quote: ProviderEndpointConfig;
  history: ProviderEndpointConfig;
  technical: ProviderEndpointConfig;
  intraday: ProviderEndpointConfig;
  news: EodhdNewsConfig;
  fundamentals: ProviderEndpointConfig;
}

const endpointSchema = Joi.object<ProviderEndpointConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(1000).required(),
});

const newsEndpointSchema = Joi.object<EodhdNewsConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(1000).required(),
  snippetChars: Joi.number().integer().min(0).optional(),
});

export const EodhdConfigSchema = Joi.object<EodhdConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  search: endpointSchema.required(),
  quote: endpointSchema.required(),
  history: endpointSchema.required(),
  technical: endpointSchema.required(),
  intraday: endpointSchema.required(),
  news: newsEndpointSchema.required(),
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
      snippetChars: getNumberEnv(env.EODHD_NEWS_SNIPPET_CHARS, 0) as number,
    },
    fundamentals: {
      enabled: getBooleanEnv(env.EODHD_FUNDAMENTALS_ENABLED, true)!,
      results: getNumberEnv(env.EODHD_FUNDAMENTALS_RESULTS, 1) as number,
    },
  };
}
