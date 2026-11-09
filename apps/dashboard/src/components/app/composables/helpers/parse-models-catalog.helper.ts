import type { ModelsCatalog } from '@/types/models-catalog.model';
import type { OllamaModel } from '@/types/ollama-model.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOllamaModel(value: unknown): value is OllamaModel {
  if (!isRecord(value) || typeof value.model !== 'string') return false;
  return (
    (value.origin === undefined ||
      value.origin === 'local' ||
      value.origin === 'cloud') &&
    (value.parameter_size === undefined ||
      typeof value.parameter_size === 'string') &&
    (value.quantization_level === undefined ||
      typeof value.quantization_level === 'string') &&
    (value.family === undefined || typeof value.family === 'string') &&
    (value.capabilities === undefined ||
      (Array.isArray(value.capabilities) &&
        value.capabilities.every((entry) => typeof entry === 'string'))) &&
    (value.context_length === undefined ||
      (typeof value.context_length === 'number' &&
        Number.isFinite(value.context_length)))
  );
}

/** Validate the catalog payload while preserving missing-list defaults. */
export function parseModelsCatalog(value: unknown): ModelsCatalog {
  if (!isRecord(value)) throw new Error('Invalid models catalog payload');
  const models = value.models ?? [];
  const numCtxOptions = value.numCtxOptions ?? [];
  if (
    !Array.isArray(models) ||
    !models.every(isOllamaModel) ||
    !Array.isArray(numCtxOptions) ||
    !numCtxOptions.every(
      (option) => typeof option === 'number' && Number.isFinite(option),
    )
  ) {
    throw new Error('Invalid models catalog payload');
  }
  return { models, numCtxOptions };
}
