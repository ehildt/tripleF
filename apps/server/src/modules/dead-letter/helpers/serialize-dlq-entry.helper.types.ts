import type { DeadLetterJob } from '../../../generated/prisma/client.js';

/** DLQ row as it crosses the socket boundary: Date columns become ISO
 *  strings, everything else is already JSON-shaped. Identical to what the
 *  REST list endpoint returns, so the dashboard applies both uniformly. */
export type SerializedDlqEntry = {
  [K in keyof DeadLetterJob]: DeadLetterJob[K] extends Date
    ? string
    : DeadLetterJob[K] extends Date | null
      ? string | null
      : DeadLetterJob[K];
};
