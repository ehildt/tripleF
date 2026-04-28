import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import { BullMQConfig } from '@ehildt/nestjs-bullmq';
import type { RedisOptions } from 'ioredis';

export function BullMQConfigAdapter(env = process.env): BullMQConfig {
  const connection: RedisOptions = {
    host: env.BULLMQ_HOST,
    port: Number(getNumberEnv(env.BULLMQ_PORT, 6379)),
    username: env.BULLMQ_USER,
    password: env.BULLMQ_PASS,
    connectTimeout: Number(getNumberEnv(env.BULLMQ_CONNECT_TIMEOUT, 30000)),
    commandTimeout: Number(getNumberEnv(env.BULLMQ_COMMAND_TIMEOUT, 30000)),
  };

  if (getBooleanEnv(env.BULLMQ_USE_TLS)) {
    connection.tls = {
      rejectUnauthorized:
        getBooleanEnv(env.BULLMQ_TLS_REJECT_UNAUTHORIZED) ?? true,
      cert: env.BULLMQ_TLS_CERT || undefined,
      key: env.BULLMQ_TLS_KEY || undefined,
      ca: env.BULLMQ_TLS_CA || undefined,
      passphrase: env.BULLMQ_PASSPHRASE || undefined,
    };
  }

  return {
    defaultJobOptions: {
      delay: Number(getNumberEnv(env.BULLMQ_JOB_DELAY, 0)),
      lifo: getBooleanEnv(env.BULLMQ_JOB_LIFO) ?? false,
      priority: Number(getNumberEnv(env.BULLMQ_JOB_PRIORITY, 1)),
      attempts: Number(getNumberEnv(env.BULLMQ_JOB_ATTEMPTS, 15)),
      stackTraceLimit: Number(
        getNumberEnv(env.BULLMQ_JOB_STACK_TRACE_LIMIT, 10),
      ),
      removeOnComplete: {
        age: Number(getNumberEnv(env.BULLMQ_REMOVE_ON_COMPLETED_AGE, 604800)),
        count: Number(getNumberEnv(env.BULLMQ_REMOVE_ON_COMPLETED_COUNT, 1000)),
      },
      removeOnFail: {
        age: Number(getNumberEnv(env.BULLMQ_REMOVE_ON_FAIL_AGE, 604800)),
        count: Number(getNumberEnv(env.BULLMQ_REMOVE_ON_FAIL_COUNT, 1000)),
      },
      backoff: {
        type: env.BULLMQ_BACKOFF_TYPE as 'exponential' | 'fixed',
        delay: Number(getNumberEnv(env.BULLMQ_BACKOFF_DELAY, 5270)),
      },
    },
    connection,
  };
}
