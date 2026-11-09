import type { OllamaModel } from './ollama-model.model';

/** Validated payload returned by the harness models endpoint. */
export interface ModelsCatalog {
  /** Complete raw model catalog, including models ineligible for chat. */
  models: OllamaModel[];
  /** Selectable context-window sizes in ascending order. */
  numCtxOptions: number[];
}
