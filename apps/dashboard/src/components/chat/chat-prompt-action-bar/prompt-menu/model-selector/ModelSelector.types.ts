import type { OllamaModel } from '@/types/ollama-model.model';

export interface ModelSelectorProps {
  /** Whether the model dropdown is open. */
  isOpen: boolean;
  /** Whether no model is selected yet — the trigger blinks until one is picked. */
  hasNoModelSelected: boolean;
  /** The model highlighted in the list (active conversation's or global selection). */
  selectedModelName: string;
  /** Catalog: locally served models. */
  localModels: readonly OllamaModel[];
  /** Catalog: remotely served (cloud) models. */
  cloudModels: readonly OllamaModel[];
  /** Whether the catalog is being fetched. */
  isLoading: boolean;
}
