export interface ParsedFailureReason {
  /**
   * Human-readable message — the only thing list rows should ever show.
   * Never contains raw JSON.
   */
  text: string;
  /** Pretty-printed JSON when the reason was a complex object, else null. */
  raw: string | null;
}

/** Zod-issue arrays: every issue carries its own message — join the
    unique ones instead of dumping the JSON. */
function extractArrayMessage(value: unknown[]): string | null {
  const messages = value
    .map((item) => extractMessage(item))
    .filter((m): m is string => !!m);
  const unique = [...new Set(messages)];
  return unique.length > 0 ? unique.join('; ') : null;
}

function extractMessage(value: unknown): string | null {
  if (Array.isArray(value)) return extractArrayMessage(value);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['message', 'error', 'reason']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate) return candidate;
    }
    for (const key of ['error', 'cause', 'details']) {
      const nested = extractMessage(record[key]);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Split a DLQ failure reason into display parts. BullMQ stores err.message,
 * which is plain text for our own throws but can be a JSON blob for Zod or
 * AI-SDK validation errors. Complex reasons yield a short message for list
 * rows plus the pretty-printed object for the details error tab.
 */
export function parseFailureReason(
  reason: string | null | undefined,
): ParsedFailureReason | null {
  if (!reason) return null;
  if (!/^[{}[]/.test(reason.trim())) return { text: reason, raw: null };
  try {
    const parsed = JSON.parse(reason);
    return {
      text: extractMessage(parsed) ?? 'Complex failure — see the error tab',
      raw: JSON.stringify(parsed, null, 2),
    };
  } catch {
    return { text: reason, raw: null };
  }
}
