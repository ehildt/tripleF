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
 * top 3, and Google auto-resolves only the top 3 result links to real
 * URLs — deeper links can come back as unresolved google.com/goto wrappers.
 * Media endpoints (images, videos) pool assets instead, so they keep the
 * wider cap above.
 */
const rankedEndpointSchema = z.strictObject({
  enabled: z.boolean(),
  results: z.number().int().min(1).max(3),
});

export const BrightDataConfigSchema = z.strictObject({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  /** SERP API zone name (powering web/images/news/videos/places/shopping). */
  serpZone: z.string().optional(),
  /** Web Unlocker zone name (powering webpage scrape). */
  unlockerZone: z.string().optional(),
  web: rankedEndpointSchema,
  images: endpointSchema,
  news: rankedEndpointSchema,
  places: rankedEndpointSchema,
  shopping: rankedEndpointSchema,
  videos: endpointSchema,
  scrape: z.strictObject({ enabled: z.boolean() }),
});

/**
 * Shape of the validated Bright Data config. Derived from the schema, so the
 * type can never drift from the runtime contract.
 */
export type BrightDataConfig = z.infer<typeof BrightDataConfigSchema>;

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
      results: getNumberEnv(env.BRIGHT_DATA_WEB_RESULTS, 3) as number,
    },
    images: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_IMAGES_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_IMAGES_RESULTS, 10) as number,
    },
    news: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_NEWS_RESULTS, 3) as number,
    },
    places: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_PLACES_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_PLACES_RESULTS, 3) as number,
    },
    shopping: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_SHOPPING_ENABLED, true)!,
      results: getNumberEnv(env.BRIGHT_DATA_SHOPPING_RESULTS, 3) as number,
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
