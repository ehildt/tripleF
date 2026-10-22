import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

const stageConfigSchema = z.strictObject({
  retainAmount: z.number().int(),
  maxAgeMs: z.number().int(),
});

export const PostgresConfigSchema = z.strictObject({
  url: z.url({ protocol: /^postgres(ql)?$/ }),
  failed: stageConfigSchema,
  cleared: stageConfigSchema,
  removed: stageConfigSchema,
});

/**
 * Shape of the validated dead-letter Postgres config. Derived from the
 * schema, so the type can never drift from the runtime contract.
 */
export type PostgresConfig = z.infer<typeof PostgresConfigSchema>;

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
