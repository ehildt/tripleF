import type { OllamaModel } from '@/types/ollama-model.model';

export interface MemoryMaintenanceModelsConfigProps {
  /** Model override used for memory consolidation. */
  consolidateModel?: string;
  /** Model override used for memory classification. */
  classifyModel?: string;
  /** Model override used for memory reflection. */
  reflectModel?: string;
  /** Model override used for conviction synthesis. */
  convictionModel?: string;
  /** Model override used for memory clustering. */
  clusterModel?: string;
  /** Models running on the configured local Ollama host. */
  localModels: readonly OllamaModel[];
  /** Models available through Ollama Cloud. */
  cloudModels: readonly OllamaModel[];
  /** Whether the model catalog is still loading. */
  modelsLoading: boolean;
  /** Persists a new consolidation-model override. */
  onSaveConsolidateModel: (value: string) => void;
  /** Persists a new classification-model override. */
  onSaveClassifyModel: (value: string) => void;
  /** Persists a new reflection-model override. */
  onSaveReflectModel: (value: string) => void;
  /** Persists a new conviction-model override. */
  onSaveConvictionModel: (value: string) => void;
  /** Persists a new clustering-model override. */
  onSaveClusterModel: (value: string) => void;
}
