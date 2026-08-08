export interface OllamaConnectionConfig {
  host: string;
  apiKey?: string;
}

/**
 * Partial patch for the Ollama connection. Each key merges into the stored
 * overrides independently, so a patch may touch only the host or the key.
 */
export type OllamaOverridesPatch = {
  host?: string;
  apiKey?: string;
};
