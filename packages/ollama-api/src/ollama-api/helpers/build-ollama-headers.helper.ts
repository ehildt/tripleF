/**
 * Build the Authorization header for remote Ollama hosts (e.g., Ollama
 * Cloud). Local self-hosted Ollama typically doesn't require
 * authentication, so no headers are built without an API key.
 */
export function buildOllamaHeaders(apiKey?: string): Record<string, string> | undefined {
  const trimmedKey = apiKey?.trim();
  if (!trimmedKey) return undefined;
  return { Authorization: `Bearer ${trimmedKey}` };
}
