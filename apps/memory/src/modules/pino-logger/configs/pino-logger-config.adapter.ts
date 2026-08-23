import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import Joi from 'joi';
import type { LoggerOptions } from 'pino';
import pino from 'pino';

export const PinoLoggerSchema = Joi.object({
  level: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  base: Joi.object().allow(null).optional(),
  transport: Joi.object({
    target: Joi.string().valid('pino-pretty').default('pino-pretty'),
    options: Joi.object({
      translateTime: Joi.string().default('yyyy-mm-dd HH:MM:ss.l'),
      colorize: Joi.boolean().default(true),
      ignore: Joi.string().default('pid,hostname'),
      singleLine: Joi.boolean().default(false),
      colorizeObjects: Joi.boolean().default(true),
    }).required(),
  }).optional(),
}).unknown(true);

export function PinoLoggerConfigAdapter(env = process.env): LoggerOptions {
  const isProduction = env.NODE_ENV === 'production';
  const prettyEnabled = getBooleanEnv(env.LOGGER_PRETTY, !isProduction)!;

  return {
    level: env.LOGGER_LEVEL || 'info',
    base: env.LOGGER_BASE ? JSON.parse(env.LOGGER_BASE) : undefined,
    // pino's standard error serializer keeps the stack trace (and the error
    // type) instead of flattening the error to its message string.
    serializers: { err: pino.stdSerializers.err },
    transport: prettyEnabled
      ? {
          target: env.LOGGER_TRANSPORT_TARGET || 'pino-pretty',
          options: {
            translateTime:
              env.LOGGER_TRANSPORT_TRANSLATE_TIME || 'yyyy-mm-dd HH:MM:ss.l',
            colorize: getBooleanEnv(env.LOGGER_TRANSPORT_COLORIZE, true)!,
            ignore: env.LOGGER_TRANSPORT_IGNORE || 'pid,hostname',
            singleLine: getBooleanEnv(env.LOGGER_TRANSPORT_SINGLE_LINE, false)!,
            colorizeObjects: getBooleanEnv(
              env.LOGGER_TRANSPORT_COLORIZE_OBJECTS,
              true,
            )!,
          },
        }
      : undefined,
  };
}
