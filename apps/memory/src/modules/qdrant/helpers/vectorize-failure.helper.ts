/**
 * Failure classification for the vectorize queue.
 *
 * Some failures can never succeed on retry — the embedding model is not
 * pulled (404), the collection rejects the payload (400: dimension mismatch,
 * malformed point). Those should fail the job immediately instead of burning
 * three exponential-backoff attempts on a config error. Transient failures
 * (Ollama/Qdrant unreachable, 5xx, rate limits) keep the retry path.
 */

/** Thrown by the embedding client when Ollama rejects the embed request. */
export class EmbeddingFailureError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'EmbeddingFailureError';
  }
}

/** HTTP statuses that cannot succeed on retry. */
const PERMANENT_STATUS = new Set([400, 401, 403, 404, 409, 422]);

/** True when the failure is permanent and the job should not be retried. */
export function isPermanentVectorizeError(error: unknown): boolean {
  if (error instanceof EmbeddingFailureError) {
    return PERMANENT_STATUS.has(error.status);
  }
  // Qdrant REST client errors carry an HTTP `status` (ApiError).
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && PERMANENT_STATUS.has(status);
}
