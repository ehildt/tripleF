import type { OllamaModel } from '@/types/ollama-model.model';

export interface MemoryResearchConfigProps {
  /** Whether the background researcher is enabled. */
  researchEnabled?: boolean;
  /** Whether the researcher may use web search. */
  researchSearchEnabled?: boolean;
  /** Search provider used by the researcher. */
  researchProvider?: 'serper' | 'bright-data';
  /** Chat-model override used by the researcher. */
  researchModel?: string;
  /** Maximum knowledge gaps considered by a research pass. */
  researchGapLimit?: number;
  /** Maximum depth of referenced-topic follow-up research. */
  researchMaxDepth?: number;
  /** Maximum documents fetched by a research pass. */
  researchFetchBudget?: number;
  /** Maximum friction records considered by a research pass. */
  researchFrictionLimit?: number;
  /** Models running on the configured local Ollama host. */
  localModels: readonly OllamaModel[];
  /** Models available through Ollama Cloud. */
  cloudModels: readonly OllamaModel[];
  /** Whether the model catalog is still loading. */
  modelsLoading: boolean;
  /** Persists the researcher enablement flag. */
  onSaveResearchEnabled: (value: boolean) => void;
  /** Persists the researcher web-search enablement flag. */
  onSaveResearchSearchEnabled: (value: boolean) => void;
  /** Persists the researcher search provider. */
  onSaveResearchProvider: (value: string) => void;
  /** Persists the researcher model override. */
  onSaveResearchModel: (value: string) => void;
  /** Persists a new research gap limit. */
  onSaveResearchGapLimit: (value: number) => void;
  /** Persists a new research follow-up depth. */
  onSaveResearchMaxDepth: (value: number) => void;
  /** Persists a new research fetch budget. */
  onSaveResearchFetchBudget: (value: number) => void;
  /** Persists a new research friction limit. */
  onSaveResearchFrictionLimit: (value: number) => void;
}
