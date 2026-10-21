import type { DeadLetterJob } from '../../../generated/prisma/client.js';

import type { SerializedDlqEntry } from './serialize-dlq-entry.helper.types.js';

/**
 * Normalize a Prisma DLQ row for socket transport: the JSON round-trip turns
 * Date columns into ISO strings and leaves JSON columns untouched, matching
 * the shape the REST list endpoint returns.
 */
export function serializeDlqEntry(entry: DeadLetterJob): SerializedDlqEntry {
  return JSON.parse(JSON.stringify(entry)) as SerializedDlqEntry;
}
