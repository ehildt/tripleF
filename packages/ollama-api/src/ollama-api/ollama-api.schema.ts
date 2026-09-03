import Joi from 'joi';

/**
 * Joi validation schema for the serializable Ollama env config. Exported so
 * consumers can validate their own env adapter output (e.g. via
 * `@CacheReturnValue`) before handing a `resolveConnection` resolver to
 * `OllamaApiModule.registerAsync`. The resolver itself is a function supplied
 * by the app's `useFactory` and is not schema-validated.
 */
export const OllamaApiConfigSchema = Joi.object({
  host: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  keepAlive: Joi.string().optional(),
  streamChunkTimeoutMs: Joi.number().integer().min(1000).optional(),
  streamTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  generateTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  enableSmoothStream: Joi.boolean().optional(),
});
