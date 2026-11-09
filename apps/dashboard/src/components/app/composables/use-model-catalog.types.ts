/** Presentation options for one caller of the shared catalog request. */
export interface FetchModelsOptions {
  /** Show the loaded-model count after a successful 200 response. */
  refresh?: boolean;
  /** Suppress loading state and user-facing failure toasts for this caller. */
  silent?: boolean;
}

/** Public model catalog loading, readiness, and persisted-selection workflow. */
export interface ModelCatalog {
  /** Load or join the catalog request and present this caller's outcome. */
  fetchModels: (options?: FetchModelsOptions) => Promise<void>;
  /** Select a model locally and persist it best-effort for this session. */
  selectModel: (modelName: string) => void;
  /** Wait until catalog data is present or a request has completed. */
  whenModelsReady: () => Promise<void>;
}
