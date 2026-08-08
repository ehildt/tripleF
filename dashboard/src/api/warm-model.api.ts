import { getApiUrl } from './api-url';

/**
 * Fire-and-forget model warm-up: pre-loads a model's weights in Ollama so
 * the first prompt does not stall on a cold load. Failures are logged
 * server-side and never surfaced to the caller.
 */
export async function warmModel(model: string): Promise<void> {
  try {
    await fetch(getApiUrl('/api/v1/harness/warm'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    });
  } catch {
    // Offline — the warm-up is best-effort only.
  }
}
