import type { MemoryPoint } from '../../../memory-client/models/memory-point.model.js';

/** Cap on the rendered probe block, mirroring the write-job's PRIOR_MEMORY_LIMIT. */
const MEMORY_PROBE_CHAR_LIMIT = 2000;

/**
 * Render memory-probe hits as a provenance-labeled block for the intent
 * classifier. Mirrors the memoryRecall tool's line format ("… — stated by
 * the user on YYYY-MM-DD") so the classifier sees the same attribution the
 * response model later quotes. Empty input → undefined (no block).
 */
export function buildMemoryProbeSection(
  points: MemoryPoint[],
): string | undefined {
  if (points.length === 0) return undefined;

  const lines = points.map((point) => {
    const who = point.role === 'user' ? 'the user' : 'you (assistant)';
    const when = point.createdAt
      ? ` on ${new Date(point.createdAt).toISOString().slice(0, 10)}`
      : '';
    return `- "${point.text}" — stated by ${who}${when}`;
  });

  const body = lines.join('\n');
  const capped =
    body.length > MEMORY_PROBE_CHAR_LIMIT
      ? `${body.slice(0, MEMORY_PROBE_CHAR_LIMIT)}…`
      : body;

  return `MEMORY PROBE — YOUR long-term memory of this user, retrieved for THIS request. These are trusted statements the user made or asked you to remember in past conversations (never public web knowledge). Each line carries its origin and date; weigh recency against the current date/time. Use them to resolve what the user is referring to, but never treat them as the current request itself.
${capped}`;
}
