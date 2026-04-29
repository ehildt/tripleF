import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

export interface PostgresConfig {
  url: string;
  retainJobsAmount: number | undefined;
  garbageCollectJobsMs: number | undefined;
}

export const PostgresConfigSchema = Joi.object<PostgresConfig>({
  url: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  retainJobsAmount: Joi.number().integer().optional(),
  garbageCollectJobsMs: Joi.number().integer().optional(),
}).required();

export function PostgresConfigAdapter(env = process.env): PostgresConfig {
  return {
    url: env.POSTGRES_URL!,
    retainJobsAmount:
      env.FAILED_JOB_RETAIN_AMOUNT !== undefined
        ? (getNumberEnv(env.FAILED_JOB_RETAIN_AMOUNT, 0) as number)
        : undefined,
    garbageCollectJobsMs:
      env.FAILED_JOB_GARBAGE_COLLECT_MS !== undefined
        ? (getNumberEnv(env.FAILED_JOB_GARBAGE_COLLECT_MS, 0) as number)
        : undefined,
  };
}
