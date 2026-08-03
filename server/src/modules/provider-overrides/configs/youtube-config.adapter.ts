import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

interface YoutubeEndpointConfig {
  enabled: boolean;
  results: number;
}

export interface YoutubeConfig {
  enabled: boolean;
  apiKey?: string;
  videos: YoutubeEndpointConfig;
}

const endpointSchema = Joi.object<YoutubeEndpointConfig>({
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
    enabled: getBooleanEnv(env.YOUTUBE_ENABLED, true)!,
    apiKey: env.YOUTUBE_API_KEY || undefined,
    videos: {
      enabled: getBooleanEnv(env.YOUTUBE_VIDEOS_ENABLED, true)!,
      results: getNumberEnv(env.YOUTUBE_VIDEOS_RESULTS, 10) as number,
    },
  };
}
