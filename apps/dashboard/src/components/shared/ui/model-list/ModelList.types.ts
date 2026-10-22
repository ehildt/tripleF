import type { OllamaModel } from '@/types/ollama-model.model';

export interface ModelListProps {
  /** Models running on the configured Ollama host. */
  localModels: readonly OllamaModel[];
  /** Models available on Ollama Cloud (requires an Ollama API key). */
  cloudModels: readonly OllamaModel[];
  /** Name string of the currently selected model. */
  selectedModel: string;
  /** Whether models are still loading. */
  loading: boolean;
  /** Optional label for a "clear/default" row rendered above the list;
   * selecting it emits an empty string. */
  defaultLabel?: string;
}

export interface ModelListEmits {
  /** A model row was selected (empty string clears the selection). */
  select: [model: string];
}

export interface ModelListItemProps {
  /** The model entry to render. */
  model: OllamaModel;
  /** Whether this model is the currently selected one. */
  selected: boolean;
}

export interface ModelListItemEmits {
  /** This model row was selected. */
  select: [model: string];
}
