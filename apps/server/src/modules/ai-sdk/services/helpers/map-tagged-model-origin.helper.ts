import type { TaggedModel } from '../ollama-models.service.types.js';

/** Stamp a fetched tag with its origin (cloud vs local). */
export function mapTaggedModelOrigin(
  model: Pick<TaggedModel, 'name' | 'details'>,
  hostIsCloud: boolean,
): TaggedModel {
  return { ...model, origin: hostIsCloud ? 'cloud' : 'local' };
}
