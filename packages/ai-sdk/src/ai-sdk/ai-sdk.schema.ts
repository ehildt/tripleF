import { z } from 'zod';

/**
 * Validates the serializable part of `AiSdkConfig`. The `createModel`
 * factory is a function supplied by the app's `useFactory` and is not
 * schema-validated.
 */
export const AiSdkConfigSchema = z.strictObject({
  streamChunkTimeoutMs: z.number().int().min(1000).optional(),
  streamTotalTimeoutMs: z.number().int().min(1000).optional(),
  generateTotalTimeoutMs: z.number().int().min(1000).optional(),
  enableSmoothStream: z.boolean().optional(),
});
