import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import Joi from 'joi';

import type { ProviderEndpointConfig } from './endpoint-config.types.js';

export interface YoutubeConfig {
  enabled: boolean;
  apiKey?: string;
  videos: ProviderEndpointConfig;
}

const endpointSchema = Joi.object<ProviderEndpointConfig>({
  enabled: Joi.boolean().required(),
  // YouTube's search.list caps maxResults at 50 — unlike Serper endpoints.
  results: Joi.number().integer().min(1).max(50).required(),
});

export const YoutubeConfigSchema = Joi.object<YoutubeConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  videos: endpointSchema.required(),
}).required();

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
