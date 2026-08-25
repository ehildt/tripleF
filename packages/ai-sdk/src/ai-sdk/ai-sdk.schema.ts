import Joi from 'joi';

/**
 * Validates the serializable part of `AiSdkConfig`. The `createModel`
 * factory is a function supplied by the app's `useFactory` and is not
 * schema-validated.
 */
export const AiSdkConfigSchema = Joi.object({
  streamChunkTimeoutMs: Joi.number().integer().min(1000).optional(),
  streamTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  generateTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  enableSmoothStream: Joi.boolean().optional(),
});
