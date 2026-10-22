import { z } from 'zod';

export const AppConfigSchema = z.strictObject({
  printConfig: z.boolean(),
  enableSwagger: z.boolean(),
  bodyLimit: z.number().min(1),
  address: z.union([z.ipv4(), z.ipv6()]),
  port: z.number().int().min(1).max(65535),
  nodeEnv: z.enum(['development', 'production', 'test', 'local']),
  cors: z
    .strictObject({
      origin: z.string().optional(),
      methods: z.string().optional(),
      preflightContinue: z.boolean().optional(),
      optionsSuccessStatus: z.number().optional(),
      credentials: z.boolean().optional(),
      allowedHeaders: z.string().optional(),
    })
    .optional(),
  health: z
    .strictObject({
      memoryHeap: z.number().min(0).optional(),
      memoryRSS: z.number().min(0).optional(),
      diskPath: z.string().optional(),
      diskThresholdPercent: z.number().min(0).optional(),
    })
    .optional(),
});

/**
 * Shape of the validated app config. Derived from the schema, so the type
 * can never drift from the runtime contract.
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;
