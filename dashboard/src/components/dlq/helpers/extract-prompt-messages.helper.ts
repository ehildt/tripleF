import type { DlqEntry } from '@/types/dlq-entry.model';

import type { DlqPromptMessage } from './extract-prompt-messages.helper.types';

function normalizeMessages(raw: unknown): DlqPromptMessage[] {
  if (Array.isArray(raw)) return raw as DlqPromptMessage[];
  if (raw && typeof raw === 'object') {
    const content = (raw as { content?: unknown }).content;
    if (Array.isArray(content)) return content as DlqPromptMessage[];
  }
  return [];
}

/**
 * Extract the prompt message list from a DLQ entry's payload filters. The
 * prompt may be stored as an array, as `{ content: [...] }`, or as a JSON
 * string of either shape — anything else yields an empty list.
 */
export function extractPromptMessages(
  entry: DlqEntry | undefined,
): DlqPromptMessage[] {
  const payload = entry?.payload as Record<string, unknown> | null;
  const filters = payload?.filters as Record<string, unknown> | undefined;
  const raw = filters?.prompt;
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      return normalizeMessages(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return normalizeMessages(raw);
}
