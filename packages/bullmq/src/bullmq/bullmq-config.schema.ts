import { z } from 'zod';

/**
 * TLS material arrives as a Buffer from file reads or as a raw string from
 * env vars. Joi's `binary()` accepted both and coerced strings to Buffers;
 * this union preserves that behavior so validated configs always carry
 * Buffers.
 */
const bufferFromStringOrBuffer = z.union([z.instanceof(Buffer), z.string().transform((value) => Buffer.from(value))]);

export const BullMQConfigSchema = z.strictObject({
  defaultJobOptions: z
    .strictObject({
      delay: z.number().min(0).optional(),
      lifo: z.boolean().optional(),
      priority: z.number().min(0).optional(),
      attempts: z.number().min(1).max(50).optional(),
      stackTraceLimit: z.number().min(1).optional(),
      removeOnComplete: z
        .strictObject({
          age: z.number().optional(),
          count: z.number().optional(),
        })
        .optional(),
      removeOnFail: z
        .strictObject({
          age: z.number().min(0).optional(),
          count: z.number().min(0).optional(),
        })
        .optional(),
      backoff: z
        .strictObject({
          type: z.enum(['exponential', 'fixed']).optional(),
          delay: z.number().min(0).optional(),
        })
        .optional(),
    })
    .optional(),
  connection: z
    .strictObject({
      enableReadyCheck: z.boolean().optional(),
      host: z.hostname().optional(),
      password: z.string().optional(),
      username: z.string().optional(),
      port: z.number().min(1).max(65535).optional(),
      connectTimeout: z.number().min(1000).optional(),
      commandTimeout: z.number().min(1000).optional(),
      retryStrategy: z.any().optional(),
      tls: z
        .strictObject({
          rejectUnauthorized: z.boolean().optional(),
          ca: bufferFromStringOrBuffer.optional(),
          cert: bufferFromStringOrBuffer.optional(),
          key: bufferFromStringOrBuffer.optional(),
          passphrase: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
});
