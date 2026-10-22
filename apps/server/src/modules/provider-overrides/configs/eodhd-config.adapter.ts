import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

const endpointSchema = z.strictObject({
  enabled: z.boolean(),
  results: z.number().int().min(1).max(1000),
});

const newsEndpointSchema = endpointSchema.extend({
  /** Optional news-body cap (chars); 0 = uncapped. */
  snippetChars: z.number().int().min(0).optional(),
});

/** The news table: an endpoint config plus the optional snippet cap. */
export type EodhdNewsConfig = z.infer<typeof newsEndpointSchema>;

export const EodhdConfigSchema = z.strictObject({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  search: endpointSchema,
  quote: endpointSchema,
  history: endpointSchema,
  technical: endpointSchema,
  intraday: endpointSchema,
  news: newsEndpointSchema,
  fundamentals: endpointSchema,
});

/**
 * Shape of the validated EODHD config. Derived from the schema, so the type
 * can never drift from the runtime contract.
 */
export type EodhdConfig = z.infer<typeof EodhdConfigSchema>;

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
