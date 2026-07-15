import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import type { LoggerOptions } from 'pino';

export function BullMQLoggerConfigAdapter(env = process.env): LoggerOptions {
  const base = env.BULLMQ_LOG_BASE ? JSON.parse(env.BULLMQ_LOG_BASE) : null;

  return {
    level: env.BULLMQ_LOG_LEVEL || 'info',
    base,
    timestamp: getBooleanEnv(env.BULLMQ_LOG_TIMESTAMP_ENABLED, true)!
      ? () => `,"timestamp":"${new Date().toISOString()}"`
      : false,
    transport: {
      target: env.BULLMQ_LOG_TRANSPORT_TARGET || 'pino-pretty',
      options: {
        translateTime:
          env.BULLMQ_LOG_TRANSPORT_TRANSLATE_TIME || 'yyyy-mm-dd HH:MM:ss.l',
        colorize: getBooleanEnv(env.BULLMQ_LOG_TRANSPORT_COLORIZE, true)!,
        ignore: env.BULLMQ_LOG_TRANSPORT_IGNORE || 'pid,hostname',
      },
    },
  };
}
