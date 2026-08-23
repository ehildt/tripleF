import { getNumberEnv } from '@triplef/helpers/get-number-env';

export const VECTORIZE_QUEUE = 'vectorize';

export const VECTORIZE_WORKER_CONCURRENCY = getNumberEnv(
  process.env.BULLMQ_VECTORIZE_CONCURRENCY,
  2,
) as number;
