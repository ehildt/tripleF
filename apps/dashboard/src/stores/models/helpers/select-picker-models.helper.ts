import type { OllamaModel } from '@/types/ollama-model.model';

/** Select capability-bearing models for one picker group and sort them by name. */
export function selectPickerModels(
  models: readonly OllamaModel[],
  origin: 'local' | 'cloud',
): OllamaModel[] {
  return models
    .filter(
      (model) =>
        (origin === 'cloud'
          ? model.origin === 'cloud'
          : model.origin !== 'cloud') && (model.capabilities?.length ?? 0) > 0,
    )
    .sort((first, second) =>
      first.model.localeCompare(second.model, undefined, {
        sensitivity: 'base',
      }),
    );
}
