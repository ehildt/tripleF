import type { createOllama } from 'ollama-ai-provider-v2';

/** The effective Ollama connection at request time (env baseline + live overrides). */
export interface OllamaConnection {
  host: string;
  apiKey?: string;
}

export type ModelOrigin = 'local' | 'cloud';

export interface ShowResult {
  capabilities?: string[];
  model_info?: Record<string, unknown>;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface TaggedModel {
  name: string;
  details?: Record<string, unknown>;
  origin: ModelOrigin;
}

export interface ModelCatalogEntry {
  model: string;
  origin: ModelOrigin;
  parameter_size?: unknown;
  quantization_level?: unknown;
  family?: unknown;
  capabilities: string[];
  context_length?: number;
}

export interface OllamaModelsCatalog {
  models: ModelCatalogEntry[];
}

/** The provider factory returned by `createOllama` — one per host/API-key pair. */
export type OllamaProvider = ReturnType<typeof createOllama>;

export type OllamaApiConfig = {
  /**
   * Resolve the effective connection per call. The consuming app supplies
   * the resolver (e.g. env defaults layered with live overrides), so
   * connection changes take effect immediately without a restart.
   */
  resolveConnection: () => OllamaConnection;
  /** Catalog cache TTL in ms. Defaults to DEFAULT_MODELS_CACHE_TTL_MS. */
  modelsCacheTtlMs?: number;
  /** Per-model `/api/show` cache TTL in ms. Defaults to DEFAULT_SHOW_CACHE_TTL_MS. */
  showCacheTtlMs?: number;
  /**
   * When set, the model-origin catalog is warmed at boot and re-fetched on
   * this interval. Apps without an endpoint that warms the catalog lazily
   * enable this, so getModelOrigin never falls back to 'local' for cloud
   * models (which would route them at the wrong host).
   */
  refreshIntervalMs?: number;
};

export type OllamaApiConfigFactory = (...deps: any[]) => Promise<OllamaApiConfig> | OllamaApiConfig;

export type OllamaApiModuleProps = {
  global?: boolean;
  inject?: Array<any>;
  useFactory: OllamaApiConfigFactory;
};
