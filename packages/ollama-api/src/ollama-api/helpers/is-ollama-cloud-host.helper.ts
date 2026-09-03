import { OLLAMA_CLOUD_HOST } from '../ollama-api.constants.ts';

/** Whether the given Ollama host already points at Ollama Cloud. */
export function isOllamaCloudHost(host: string): boolean {
  return host.replace(/\/+$/, '') === OLLAMA_CLOUD_HOST;
}
