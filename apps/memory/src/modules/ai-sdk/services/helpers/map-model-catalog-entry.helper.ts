import type {
  ShowResult,
  TaggedModel,
} from '../ollama-models.service.types.js';

/**
 * Build a catalog entry from a tagged model and its /show payload. The
 * Ollama Cloud catalog returns empty detail strings, so the /show payload
 * (already fetched for capabilities) carries the raw parameter count and
 * quantization.
 */
export function mapModelCatalogEntry(
  entry: TaggedModel,
  show: ShowResult | null,
  contextLength: number | undefined,
) {
  return {
    model: entry.name,
    origin: entry.origin,
    parameter_size:
      entry.details?.parameter_size || show?.details?.parameter_size,
    quantization_level:
      entry.details?.quantization_level || show?.details?.quantization_level,
    family: entry.details?.family,
    capabilities: show?.capabilities ?? [],
    context_length: contextLength,
  };
}
