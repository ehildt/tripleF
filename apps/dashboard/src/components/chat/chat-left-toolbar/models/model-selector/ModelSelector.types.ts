import type { OllamaModel } from '@/types/ollama-model.model';

export interface ModelSelectorProps {
  /** Whether the model dropdown is open. */
  isOpen: boolean;
  /** Displayed model name (the active conversation's or global selection). */
  selectedModelName: string;
  /** Whether the selected model exists in the fetched catalog. */
  isModelMissing: boolean;
  /** Catalog: locally served models. */
  localModels: readonly OllamaModel[];
  /** Catalog: remotely served (cloud) models. */
  cloudModels: readonly OllamaModel[];
  /** Whether the catalog is being fetched. */
  isLoading: boolean;
}
