import { getNumberEnv } from '@triplef/helpers/get-number-env';
import Joi from 'joi';

import type { DlqStageConfig } from './postgres-config.types.js';

export interface PostgresConfig {
  url: string;
  failed: DlqStageConfig;
  cleared: DlqStageConfig;
  removed: DlqStageConfig;
}

const stageConfigSchema = Joi.object<DlqStageConfig>({
  retainAmount: Joi.number().integer().required(),
  maxAgeMs: Joi.number().integer().required(),
}).required();

export const PostgresConfigSchema = Joi.object<PostgresConfig>({
  url: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  failed: stageConfigSchema,
  cleared: stageConfigSchema,
  removed: stageConfigSchema,
}).required();

export function PostgresConfigAdapter(env = process.env): PostgresConfig {
  return {
    url: env.POSTGRES_URL!,
    failed: {
      retainAmount: getNumberEnv(env.DLQ_FAILED_RETAIN, 100) as number,
      maxAgeMs: getNumberEnv(env.DLQ_FAILED_AGE_MS, 604_800_000) as number,
    },
    cleared: {
      retainAmount: getNumberEnv(env.DLQ_CLEARED_RETAIN, 100) as number,
      maxAgeMs: getNumberEnv(env.DLQ_CLEARED_AGE_MS, 2_592_000_000) as number,
    },
    removed: {
      retainAmount: getNumberEnv(env.DLQ_REMOVED_RETAIN, 0) as number,
      maxAgeMs: getNumberEnv(env.DLQ_REMOVED_AGE_MS, 86_400_000) as number,
    },
  };
}
