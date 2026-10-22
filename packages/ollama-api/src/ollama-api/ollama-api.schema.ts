import { z } from 'zod';

/**
 * Zod validation schema for the serializable Ollama env config. Exported so
 * consumers can validate their own env adapter output (e.g. via
 * `@CacheReturnValue`) before handing a `resolveConnection` resolver to
 * `OllamaApiModule.registerAsync`. The resolver itself is a function supplied
 * by the app's `useFactory` and is not schema-validated.
 */
export const OllamaApiConfigSchema = z.strictObject({
  host: z.string().optional(),
  apiKey: z.string().optional(),
  keepAlive: z.string().optional(),
  streamChunkTimeoutMs: z.number().int().min(1000).optional(),
  streamTotalTimeoutMs: z.number().int().min(1000).optional(),
  generateTotalTimeoutMs: z.number().int().min(1000).optional(),
  enableSmoothStream: z.boolean().optional(),
});
