import type { PreprocessingSettings } from '@/types/preprocessing.model';

/** Session-config fields the dashboard may update without replacing unrelated settings. */
export interface SessionConfigPatch {
  /** Selected harness model name. */
  selectedModel?: string;
  /** Complete preprocessing snapshot for this browser session. */
  preprocessing?: PreprocessingSettings;
  /** Provider-specific model parameters keyed by provider option name. */
  providerOverrides?: Record<string, unknown>;
  /** Memory partition identifier, or null to clear the override. */
  memoryPartition?: string | null;
  /** Memory cognition identifier, or null to clear the override. */
  memoryCognition?: string | null;
}
