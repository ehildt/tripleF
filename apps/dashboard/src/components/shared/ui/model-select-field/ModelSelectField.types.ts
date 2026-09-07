import type { OllamaModel } from '@/types/ollama-model.model';

export interface ModelSelectFieldProps {
  /**
   * Current model override; an empty value stands for the env baseline and
   * renders as the "Default" option. Defaults to ''.
   */
  modelValue?: string;
  /** Models running on the configured Ollama host. */
  localModels: readonly OllamaModel[];
  /** Models available on Ollama Cloud (requires an Ollama API key). */
  cloudModels: readonly OllamaModel[];
  /** Whether the model catalog is still loading. */
  loading: boolean;
  /**
   * Optional label for a "clear/default" pseudo-option rendered above the
   * list; selecting it emits an empty string. Omit to hide the option.
   */
  defaultLabel?: string;
  /** Disables the trigger (read-only contexts). */
  disabled?: boolean;
  /** Shows an error indicator on the trigger (e.g. model missing from the catalog). */
  errored?: boolean;
}

export interface ModelSelectFieldEmits {
  /**
   * Emitted with the picked model name, or '' when the user picks the
   * env-baseline default (the override is cleared).
   */
  (e: 'update:modelValue', value: string): void;
}
