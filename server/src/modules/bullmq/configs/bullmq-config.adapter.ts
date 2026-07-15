import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import { BullMQConfig } from '@ehildt/nestjs-bullmq';
import type { RedisOptions } from 'ioredis';

export interface ExtendedBullMQConfig extends BullMQConfig {
  defaultJobOptions: BullMQConfig['defaultJobOptions'] & {
    backoff: { type: 'exponential' | 'fixed'; delay: number };
  };
  failedJobRetryDelayMs: number;
  failedJobReinstateBatchSize: number;
}

export function BullMQConfigAdapter(env = process.env): ExtendedBullMQConfig {
  const connection: RedisOptions = {
    host: env.BULLMQ_HOST,
    port: getNumberEnv(env.BULLMQ_PORT, 6379) as number,
    username: env.BULLMQ_USER,
    password: env.BULLMQ_PASS,
    connectTimeout: getNumberEnv(env.BULLMQ_CONNECT_TIMEOUT, 30000) as number,
    commandTimeout: getNumberEnv(env.BULLMQ_COMMAND_TIMEOUT, 30000) as number,
  };

  if (getBooleanEnv(env.BULLMQ_USE_TLS, false)) {
    connection.tls = {
      rejectUnauthorized: getBooleanEnv(
        env.BULLMQ_TLS_REJECT_UNAUTHORIZED,
        true,
      )!,
      cert: env.BULLMQ_TLS_CERT || undefined,
      key: env.BULLMQ_TLS_KEY || undefined,
      ca: env.BULLMQ_TLS_CA || undefined,
      passphrase: env.BULLMQ_PASSPHRASE || undefined,
    };
  }

  return {
    defaultJobOptions: {
      delay: getNumberEnv(env.BULLMQ_JOB_DELAY, 0) as number,
      lifo: getBooleanEnv(env.BULLMQ_JOB_LIFO, false)!,
      priority: getNumberEnv(env.BULLMQ_JOB_PRIORITY, 1) as number,
      attempts: getNumberEnv(env.BULLMQ_JOB_ATTEMPTS, 3) as number,
      stackTraceLimit: getNumberEnv(
        env.BULLMQ_JOB_STACK_TRACE_LIMIT,
        10,
      ) as number,
      backoff: {
        type: env.BULLMQ_BACKOFF_TYPE as 'exponential' | 'fixed',
        delay: getNumberEnv(env.BULLMQ_BACKOFF_DELAY, 10000) as number,
      },
      removeOnComplete: { count: 1, age: 0 },
      removeOnFail: { count: 1, age: 0 },
    },
    connection,
    failedJobRetryDelayMs: getNumberEnv(
      env.FAILED_JOB_RETRY_DELAY_MS,
      300_000,
    ) as number,
    failedJobReinstateBatchSize: getNumberEnv(
      env.FAILED_JOB_REINSTATE_BATCH_SIZE,
      10,
    ) as number,
  };
}
