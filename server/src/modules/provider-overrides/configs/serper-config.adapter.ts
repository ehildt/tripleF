import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

interface SerperEndpointConfig {
  enabled: boolean;
  results: number;
}

export interface SerperConfig {
  enabled: boolean;
  apiKey?: string;
  web: SerperEndpointConfig;
  images: SerperEndpointConfig;
  news: SerperEndpointConfig;
  places: SerperEndpointConfig;
  shopping: SerperEndpointConfig;
  reviews: SerperEndpointConfig;
  videos: SerperEndpointConfig;
  scrape: { enabled: boolean };
}

const endpointSchema = Joi.object<SerperEndpointConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(200).required(),
});

export const SerperConfigSchema = Joi.object<SerperConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  web: endpointSchema.required(),
  images: endpointSchema.required(),
  news: endpointSchema.required(),
  places: endpointSchema.required(),
  shopping: endpointSchema.required(),
  reviews: endpointSchema.required(),
  videos: endpointSchema.required(),
  scrape: Joi.object({ enabled: Joi.boolean().required() }).required(),
}).required();

export function SerperConfigAdapter(env = process.env): SerperConfig {
  return {
    enabled: getBooleanEnv(env.SERPER_ENABLED, true)!,
    apiKey: env.SERPER_API_KEY || undefined,
    web: {
      enabled: getBooleanEnv(env.SERPER_WEB_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_WEB_RESULTS, 3) as number,
    },
    images: {
      enabled: getBooleanEnv(env.SERPER_IMAGES_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_IMAGES_RESULTS, 6) as number,
    },
    news: {
      enabled: getBooleanEnv(env.SERPER_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_NEWS_RESULTS, 3) as number,
    },
    places: {
      enabled: getBooleanEnv(env.SERPER_PLACES_ENABLED, false)!,
      results: getNumberEnv(env.SERPER_PLACES_RESULTS, 5) as number,
    },
    shopping: {
      enabled: getBooleanEnv(env.SERPER_SHOPPING_ENABLED, false)!,
      results: getNumberEnv(env.SERPER_SHOPPING_RESULTS, 5) as number,
    },
    reviews: {
      enabled: getBooleanEnv(env.SERPER_REVIEWS_ENABLED, false)!,
      results: getNumberEnv(env.SERPER_REVIEWS_RESULTS, 5) as number,
    },
    videos: {
      enabled: getBooleanEnv(env.SERPER_VIDEOS_ENABLED, false)!,
      results: getNumberEnv(env.SERPER_VIDEOS_RESULTS, 6) as number,
    },
    scrape: {
      enabled: getBooleanEnv(env.SERPER_SCRAPE_ENABLED, true)!,
    },
  };
}
