import type { DlqEntry } from '@/types/dlq-entry.model';

import type { DlqEntryFilters } from './extract-entry-filters.helper.types';

function readFilters(entry: DlqEntry): Record<string, unknown> {
  const filters = entry.payload?.filters;
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new Error(`DLQ entry ${entry.id} has no harness filters`);
  }
  return filters as Record<string, unknown>;
}

function readRequiredString(
  filters: Record<string, unknown>,
  key: 'conversationId' | 'event',
): string {
  const value = filters[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`DLQ harness payload is missing filters.${key}`);
  }
  return value;
}

function readOptionalString(
  filters: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = filters[key];
  return value == null ? undefined : String(value);
}

function readOptionalBoolean(
  filters: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = filters[key];
  if (value == null) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`DLQ harness payload has an invalid filters.${key}`);
}

/** Extract the required routing identity and original conversation settings
 * from a harness DLQ entry. Invalid harness data fails explicitly: the DLQ
 * has no legacy/default routing path that could target the wrong chat. */
export function extractEntryFilters(entry: DlqEntry): DlqEntryFilters {
  const filters = readFilters(entry);
  return {
    conversationId: readRequiredString(filters, 'conversationId'),
    roomId: readOptionalString(filters, 'roomId') ?? '',
    event: readRequiredString(filters, 'event'),
    model: readOptionalString(filters, 'model') ?? '',
    numCtx: readOptionalString(filters, 'numCtx'),
    think: readOptionalString(filters, 'think'),
    stream: readOptionalBoolean(filters, 'stream'),
  };
}
