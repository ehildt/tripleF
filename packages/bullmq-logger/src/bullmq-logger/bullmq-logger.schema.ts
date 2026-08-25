import Joi from 'joi';
import type { LoggerOptions } from 'pino';

/**
 * Joi validation schema for pino `LoggerOptions` used by the BullMQ job
 * logger. Validates the keys the library consumes (`level`, `base`,
 * `redact`, `timestamp`, `transport`) and lets the rest of pino's
 * `LoggerOptions` through via `.unknown(true)`.
 */
export const BullMQLoggerSchema = Joi.object<LoggerOptions>({
  level: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),
  base: Joi.object().allow(null).optional(),
  redact: Joi.object({
    paths: Joi.array().items(Joi.string()).required(),
    censor: Joi.string().optional(),
  }).optional(),
  timestamp: Joi.alternatives(Joi.func(), Joi.boolean()).optional(),
  transport: Joi.object({
    target: Joi.string().valid('pino-pretty').default('pino-pretty'),
    options: Joi.object({
      translateTime: Joi.string().default('yyyy-mm-dd HH:MM:ss.l'),
      colorize: Joi.boolean().default(true),
      ignore: Joi.string().default('pid,hostname'),
    }).required(),
  }).optional(),
}).unknown(true);
