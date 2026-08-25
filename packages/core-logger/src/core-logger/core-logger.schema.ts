import Joi from 'joi';

/**
 * Joi validation schema for pino `LoggerOptions`. Exported so consumers can
 * validate their own pino config (e.g. via `@ValidateReturnValue`) before
 * handing it to `CoreLoggerModule.registerAsync`.
 */
export const CoreLoggerSchema = Joi.object({
  level: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),
  base: Joi.object().allow(null).optional(),
  transport: Joi.object({
    target: Joi.string().valid('pino-pretty').default('pino-pretty'),
    options: Joi.object({
      translateTime: Joi.string().default('yyyy-mm-dd HH:MM:ss.l'),
      colorize: Joi.boolean().default(true),
      ignore: Joi.string().default('pid,hostname,context'),
      singleLine: Joi.boolean().default(false),
      colorizeObjects: Joi.boolean().default(true),
      messageFormat: Joi.alternatives(Joi.string(), Joi.func()).optional(),
    }).required(),
  }).optional(),
}).unknown(true);
