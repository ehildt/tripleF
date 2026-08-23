import { getNumberEnv } from '@triplef/helpers/get-number-env';

export const HARNESS_QUEUE = 'harness';

export const HARNESS_WORKER_CONCURRENCY = getNumberEnv(
  process.env.BULLMQ_WORKER_CONCURRENCY,
  3,
) as number;

export const VECTORIZE_QUEUE = 'vectorize';
