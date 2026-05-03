import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

interface BraveEndpointConfig {
  enabled: boolean;
  results: number;
}

export interface BraveConfig {
  enabled: boolean;
  apiKey?: string;
  web: BraveEndpointConfig;
  images: BraveEndpointConfig;
  news: BraveEndpointConfig;
  video: BraveEndpointConfig;
}

const endpointSchema = Joi.object<BraveEndpointConfig>({
  enabled: Joi.boolean().required(),
  results: Joi.number().integer().min(1).max(200).required(),
});

export const BraveConfigSchema = Joi.object<BraveConfig>({
  enabled: Joi.boolean().required(),
  apiKey: Joi.string().optional(),
  web: endpointSchema.required(),
  images: endpointSchema.required(),
  news: endpointSchema.required(),
  video: endpointSchema.required(),
}).required();

export function BraveConfigAdapter(env = process.env): BraveConfig {
  return {
    enabled: getBooleanEnv(env.BRAVE_ENABLED, true)!,
    apiKey: env.BRAVE_API_KEY || undefined,
    web: {
      enabled: getBooleanEnv(env.BRAVE_WEB_ENABLED, true)!,
      results: getNumberEnv(env.BRAVE_WEB_RESULTS, 3) as number,
    },
    images: {
      enabled: getBooleanEnv(env.BRAVE_IMAGES_ENABLED, true)!,
      results: getNumberEnv(env.BRAVE_IMAGES_RESULTS, 6) as number,
    },
    news: {
      enabled: getBooleanEnv(env.BRAVE_NEWS_ENABLED, true)!,
      results: getNumberEnv(env.BRAVE_NEWS_RESULTS, 3) as number,
    },
    video: {
      enabled: getBooleanEnv(env.BRAVE_VIDEO_ENABLED, true)!,
      results: getNumberEnv(env.BRAVE_VIDEO_RESULTS, 6) as number,
    },
  };
}
