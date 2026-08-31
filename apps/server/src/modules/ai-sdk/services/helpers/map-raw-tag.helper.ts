import type { TaggedModel } from '../ollama-models.service.types.js';

/** Normalize a raw Ollama /tags entry into the tagged-model shape. */
export function mapRawTag(
  m: Record<string, unknown>,
): Pick<TaggedModel, 'name' | 'details'> {
  return {
    name: m.model as string,
    details: m.details as Record<string, unknown> | undefined,
  };
}
