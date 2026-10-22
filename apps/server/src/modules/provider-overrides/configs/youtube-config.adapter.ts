import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

const endpointSchema = z.strictObject({
  enabled: z.boolean(),
  // YouTube's search.list caps maxResults at 50 — unlike Serper endpoints.
  results: z.number().int().min(1).max(50),
});

export const YoutubeConfigSchema = z.strictObject({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  videos: endpointSchema,
});

/**
 * Shape of the validated YouTube config. Derived from the schema, so the
 * type can never drift from the runtime contract.
 */
export type YoutubeConfig = z.infer<typeof YoutubeConfigSchema>;

export function YoutubeConfigAdapter(env = process.env): YoutubeConfig {
  return {
    enabled: getBooleanEnv(env.YOUTUBE_ENABLED, false)!,
    apiKey: env.YOUTUBE_API_KEY || undefined,
    videos: {
      enabled: getBooleanEnv(env.YOUTUBE_VIDEOS_ENABLED, true)!,
      results: getNumberEnv(env.YOUTUBE_VIDEOS_RESULTS, 10) as number,
    },
  };
}
