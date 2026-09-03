/** Injection token for the Ollama API config. */
export const OLLAMA_API_CONFIG = Symbol('OLLAMA_API_CONFIG');

/**
 * Ollama Cloud acts as a remote Ollama host: the model catalog and the
 * chat API live under this base URL and require Bearer authentication.
 * https://docs.ollama.com/cloud
 */
export const OLLAMA_CLOUD_HOST = 'https://ollama.com/api';

/**
 * Backoff for the cloud catalog retries (immediate, +1s, +3s) — see
 * OllamaApiService.fetchCloudTags.
 */
export const CLOUD_RETRY_DELAYS_MS = [0, 1000, 3000] as const;

/**
 * Default catalog cache TTL. In production the catalog changes rarely, so 5
 * minutes avoids re-fetching on every lookup; consumers that need fresh data
 * during development pass a smaller `modelsCacheTtlMs`.
 */
export const DEFAULT_MODELS_CACHE_TTL_MS = 300_000;

/** Default TTL for the per-model `/api/show` payload cache. */
export const DEFAULT_SHOW_CACHE_TTL_MS = 300_000;
