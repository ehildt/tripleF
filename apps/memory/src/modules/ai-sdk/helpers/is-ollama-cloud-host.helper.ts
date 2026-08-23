import { OLLAMA_CLOUD_HOST } from '../constants/ollama-cloud.constants.js';

/** Whether the given Ollama host already points at Ollama Cloud. */
export function isOllamaCloudHost(host: string): boolean {
  return host.replace(/\/+$/, '') === OLLAMA_CLOUD_HOST;
}
