import type { LoggerOptions } from 'pino';

import { getBooleanEnv } from '../get-boolean-env/get-boolean-env.helper.ts';

import { REDACT_CENSOR, REDACT_PATHS } from './redact-paths.constant.ts';

/**
 * Build the pino `LoggerOptions` for the app-wide core logger from env.
 * Pretty-prints outside production (override with `LOGGER_PRETTY`) and
 * redacts secret-shaped fields. pino's default `err` serializer already
 * emits type, message, and stack for `err` bindings.
 */
export function createCoreLoggerOptions(env = process.env): LoggerOptions {
  const isProduction = env.NODE_ENV === 'production';
  const prettyEnabled = getBooleanEnv(env.LOGGER_PRETTY, !isProduction)!;

  return {
    level: env.LOGGER_LEVEL || 'info',
    base: env.LOGGER_BASE ? JSON.parse(env.LOGGER_BASE) : undefined,
    redact: { paths: REDACT_PATHS, censor: REDACT_CENSOR },
    transport: prettyEnabled
      ? {
          target: env.LOGGER_TRANSPORT_TARGET || 'pino-pretty',
          options: {
            translateTime: env.LOGGER_TRANSPORT_TRANSLATE_TIME || 'yyyy-mm-dd HH:MM:ss.l',
            colorize: getBooleanEnv(env.LOGGER_TRANSPORT_COLORIZE, true)!,
            ignore: env.LOGGER_TRANSPORT_IGNORE || 'pid,hostname,context',
            singleLine: getBooleanEnv(env.LOGGER_TRANSPORT_SINGLE_LINE, false)!,
            colorizeObjects: getBooleanEnv(env.LOGGER_TRANSPORT_COLORIZE_OBJECTS, true)!,
            // Render the NestJS context inline as `[Context] message`; the
            // `context` key is ignored above so it isn't printed twice. A
            // string template is used (not a function) because pino's worker
            // transport cannot clone functions across the thread boundary.
            messageFormat: '{if context}[{context}] {end}{msg}',
          },
        }
      : undefined,
  };
}
