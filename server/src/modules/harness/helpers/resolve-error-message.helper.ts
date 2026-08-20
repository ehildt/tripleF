/**
 * Turn an unknown step failure into a user-facing message. Model-provider
 * call errors (the AI SDK `APICallError` family) carry the actionable copy
 * in their response body — e.g. Ollama's 429 quota rejection explains the
 * monthly usage cap and points to the settings page. Falling back to the
 * error's `message` alone yields bare status texts like "Too Many Requests".
 */
interface ApiCallErrorLike {
  statusCode?: number;
  responseBody?: string;
  message?: string;
}

function isApiCallErrorLike(value: unknown): value is ApiCallErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    typeof (value as ApiCallErrorLike).statusCode === 'number' &&
    typeof (value as ApiCallErrorLike).responseBody === 'string'
  );
}

/** Extract the human-readable text from a JSON provider error body. */
function parseResponseBodyMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (typeof parsed === 'string' && parsed.length > 0) return parsed;

    const record = parsed as Record<string, unknown>;
    const error = record?.error;
    if (typeof error === 'string' && error.length > 0) return error;
    if (typeof error === 'object' && error !== null) {
      const nested = error as Record<string, unknown>;
      if (typeof nested.message === 'string') return nested.message;
    }
    if (typeof record?.message === 'string') return record.message;
    if (typeof record?.detail === 'string') return record.detail;
  } catch {
    /* body is not JSON — fall through to raw text */
  }
  return typeof body === 'string' && body.length > 0 ? body : undefined;
}

export function resolveErrorMessage(error: unknown): string {
  if (isApiCallErrorLike(error)) {
    const bodyMessage = parseResponseBodyMessage(error.responseBody);
    if (bodyMessage) {
      return error.statusCode
        ? `${error.statusCode} — ${bodyMessage}`
        : bodyMessage;
    }
    if (error.statusCode)
      return `${error.statusCode} ${error.message ?? ''}`.trim();
  }
  return error instanceof Error ? error.message : String(error);
}
