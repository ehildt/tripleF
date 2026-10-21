import type { LucideIcon } from '@lucide/vue';

import type { OllamaModel } from '@/types/ollama-model.model';

export interface ModelFieldCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
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
  /** Disables the picker trigger (read-only contexts). */
  disabled?: boolean;
  /** Shows an error indicator on the trigger (model missing from catalog). */
  errored?: boolean;
}
