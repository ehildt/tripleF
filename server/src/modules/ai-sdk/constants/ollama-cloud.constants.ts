/**
 * Ollama Cloud acts as a remote Ollama host: the model catalog and the
 * chat API live under this base URL and require Bearer authentication.
 * https://docs.ollama.com/cloud
 */
export const OLLAMA_CLOUD_HOST = 'https://ollama.com/api';

/**
 * Backoff for the cloud catalog retries (immediate, +1s, +3s) — see
 * OllamaModelsService.fetchCloudTags.
 */
export const CLOUD_RETRY_DELAYS_MS = [0, 1000, 3000] as const;
