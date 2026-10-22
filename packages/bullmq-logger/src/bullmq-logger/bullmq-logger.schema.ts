import { z } from 'zod';

/**
 * Zod validation schema for pino `LoggerOptions` used by the BullMQ job
 * logger. Validates the keys the library consumes (`level`, `base`,
 * `redact`, `timestamp`, `transport`) and lets the rest of pino's
 * `LoggerOptions` through via a loose object.
 */
export const BullMQLoggerSchema = z.looseObject({
  level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  base: z.looseObject({}).nullable().optional(),
  redact: z
    .strictObject({
      paths: z.array(z.string()),
      censor: z.string().optional(),
    })
    .optional(),
  timestamp: z
    .union([z.custom<(...args: never[]) => unknown>((val) => typeof val === 'function'), z.boolean()])
    .optional(),
  transport: z
    .strictObject({
      target: z.literal('pino-pretty').default('pino-pretty'),
      options: z.strictObject({
        translateTime: z.string().default('yyyy-mm-dd HH:MM:ss.l'),
        colorize: z.boolean().default(true),
        ignore: z.string().default('pid,hostname'),
      }),
    })
    .optional(),
});
