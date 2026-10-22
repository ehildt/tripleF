import { z } from 'zod';

/**
 * Zod validation schema for pino `LoggerOptions`. Exported so consumers can
 * validate their own pino config (e.g. via `@CacheReturnValue`) before
 * handing it to `CoreLoggerModule.registerAsync`.
 */
export const CoreLoggerSchema = z.looseObject({
  level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  base: z.looseObject({}).nullable().optional(),
  transport: z
    .strictObject({
      target: z.literal('pino-pretty').default('pino-pretty'),
      options: z.strictObject({
        translateTime: z.string().default('yyyy-mm-dd HH:MM:ss.l'),
        colorize: z.boolean().default(true),
        ignore: z.string().default('pid,hostname,context'),
        singleLine: z.boolean().default(false),
        colorizeObjects: z.boolean().default(true),
        messageFormat: z
          .union([z.string(), z.custom<(...args: never[]) => unknown>((val) => typeof val === 'function')])
          .optional(),
      }),
    })
    .optional(),
});
