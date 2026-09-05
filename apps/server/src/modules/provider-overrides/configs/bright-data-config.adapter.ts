import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import Joi from 'joi';

import type { ProviderEndpointConfig } from './endpoint-config.types.js';

export interface BrightDataConfig {
  enabled: boolean;
  apiKey?: string;
  /** SERP API zone name (powering web/images/news/videos/places/shopping). */
  serpZone?: string;
  /** Web Unlocker zone name (powering webpage scrape). */
  unlockerZone?: string;
  web: ProviderEndpointConfig;
  images: ProviderEndpointConfig;
  news: ProviderEndpointConfig;
  places: ProviderEndpointConfig;
  shopping: ProviderEndpointConfig;
  videos: ProviderEndpointConfig;
  scrape: { enabled: boolean };
}

const endpointSchema = Joi.object<ProviderEndpointConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(200).required(),
});

export const BrightDataConfigSchema = Joi.object<BrightDataConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  serpZone: Joi.string().optional(),
  unlockerZone: Joi.string().optional(),
  web: endpointSchema.required(),
  images: endpointSchema.required(),
  news: endpointSchema.required(),
  places: endpointSchema.required(),
  shopping: endpointSchema.required(),
  videos: endpointSchema.required(),
  scrape: Joi.object({ enabled: Joi.boolean().required() }).required(),
}).required();

/**
 * Bright Data runs as an alternative search engine to Serper: it is disabled
 * by default (no API key ships with the repo) and only becomes active once a
 * SERP API key + zone are configured via Settings. Reviews are intentionally
 * absent — Bright Data's reviews endpoint is currently broken upstream (502).
 */
export function BrightDataConfigAdapter(env = process.env): BrightDataConfig {
  return {
    enabled: getBooleanEnv(env.BRIGHT_DATA_ENABLED, false)!,
    apiKey: env.BRIGHT_DATA_API_KEY || undefined,
    serpZone: env.BRIGHT_DATA_SERP_ZONE || undefined,
    unlockerZone: env.BRIGHT_DATA_UNLOCKER_ZONE || undefined,
    web: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_WEB_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_WEB_RESULTS, 10) as number,
    },
    images: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_IMAGES_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_IMAGES_RESULTS, 10) as number,
    },
    news: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_NEWS_RESULTS, 10) as number,
    },
    places: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_PLACES_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_PLACES_RESULTS, 10) as number,
    },
    shopping: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_SHOPPING_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_SHOPPING_RESULTS, 10) as number,
    },
    videos: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_VIDEOS_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_VIDEOS_RESULTS, 10) as number,
    },
    scrape: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_SCRAPE_ENABLED, true)!,
    },
  };
}
