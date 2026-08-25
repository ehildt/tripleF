import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import type { LoggerOptions } from 'pino';

import {
  REDACT_CENSOR,
  REDACT_PATHS,
} from '../../../configs/redact-paths.constant.js';

/**
 * Builds the pino `LoggerOptions` for the BullMQ job logger from env.
 * Pretty-prints outside production (override with `BULLMQ_LOG_PRETTY`) and
 * redacts secret-shaped fields. The custom `timestamp` keeps an ISO string
 * under the `timestamp` key (pino's default `time` is epoch millis).
 */
export function BullMQLoggerConfigAdapter(env = process.env): LoggerOptions {
  const isProduction = env.NODE_ENV === 'production';
  const prettyEnabled = getBooleanEnv(env.BULLMQ_LOG_PRETTY, !isProduction)!;
  const base = env.BULLMQ_LOG_BASE ? JSON.parse(env.BULLMQ_LOG_BASE) : null;

  return {
    level: env.BULLMQ_LOG_LEVEL || 'info',
    base,
    redact: { paths: REDACT_PATHS, censor: REDACT_CENSOR },
    timestamp: getBooleanEnv(env.BULLMQ_LOG_TIMESTAMP_ENABLED, true)!
      ? () => `,"timestamp":"${new Date().toISOString()}"`
      : false,
    transport: prettyEnabled
      ? {
          target: env.BULLMQ_LOG_TRANSPORT_TARGET || 'pino-pretty',
          options: {
            translateTime:
              env.BULLMQ_LOG_TRANSPORT_TRANSLATE_TIME ||
              'yyyy-mm-dd HH:MM:ss.l',
            colorize: getBooleanEnv(env.BULLMQ_LOG_TRANSPORT_COLORIZE, true)!,
            ignore: env.BULLMQ_LOG_TRANSPORT_IGNORE || 'pid,hostname',
          },
        }
      : undefined,
  };
}
