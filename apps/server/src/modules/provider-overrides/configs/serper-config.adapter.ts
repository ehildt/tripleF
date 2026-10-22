import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

const endpointSchema = z.strictObject({
  enabled: z.boolean(),
  results: z.number().int().min(1).max(200),
});

/**
 * Ranked content/entity endpoints whose results feed citations and page
 * fetching. Bounded to the top 3: ranking quality decays sharply past the
 * top 3, and Google (via Serper) auto-resolves only the top 3 result links
 * to real URLs — deeper links can come back as unresolved google.com/goto
 * wrappers. Media endpoints (images, videos) pool assets instead, so they
 * keep the wider cap above.
 */
const rankedEndpointSchema = z.strictObject({
  enabled: z.boolean(),
  results: z.number().int().min(1).max(3),
});

export const SerperConfigSchema = z.strictObject({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  web: rankedEndpointSchema,
  images: endpointSchema,
  news: rankedEndpointSchema,
  places: rankedEndpointSchema,
  shopping: rankedEndpointSchema,
  reviews: rankedEndpointSchema,
  videos: endpointSchema,
  scrape: z.strictObject({ enabled: z.boolean() }),
});

/**
 * Shape of the validated Serper config. Derived from the schema, so the type
 * can never drift from the runtime contract.
 */
export type SerperConfig = z.infer<typeof SerperConfigSchema>;

export function SerperConfigAdapter(env = process.env): SerperConfig {
  return {
    enabled: getBooleanEnv(env.SERPER_ENABLED, false)!,
    apiKey: env.SERPER_API_KEY || undefined,
    web: {
      enabled: getBooleanEnv(env.SERPER_WEB_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_WEB_RESULTS, 3) as number,
    },
    images: {
      enabled: getBooleanEnv(env.SERPER_IMAGES_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_IMAGES_RESULTS, 10) as number,
    },
    news: {
      enabled: getBooleanEnv(env.SERPER_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_NEWS_RESULTS, 3) as number,
    },
    places: {
      enabled: getBooleanEnv(env.SERPER_PLACES_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_PLACES_RESULTS, 3) as number,
    },
    shopping: {
      enabled: getBooleanEnv(env.SERPER_SHOPPING_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_SHOPPING_RESULTS, 3) as number,
    },
    reviews: {
      enabled: getBooleanEnv(env.SERPER_REVIEWS_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_REVIEWS_RESULTS, 3) as number,
    },
    videos: {
      enabled: getBooleanEnv(env.SERPER_VIDEOS_ENABLED, true)!,
      results: getNumberEnv(env.SERPER_VIDEOS_RESULTS, 10) as number,
    },
    scrape: {
      enabled: getBooleanEnv(env.SERPER_SCRAPE_ENABLED, true)!,
    },
  };
}
