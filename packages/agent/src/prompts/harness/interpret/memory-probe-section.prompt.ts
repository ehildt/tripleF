import type { MemoryPoint } from '../../../tools/memory/memory-point.model.js';
import { formatProvenanceLine } from '../../memory/format-provenance-line.helper.js';

/** Cap on the rendered probe block, so a rich probe stays a cheap hint. */
const MEMORY_PROBE_CHAR_LIMIT = 2000;

/**
 * Render memory-probe hits as a provenance-labeled block for the intent
 * classifier. Mirrors the memory-partition-recall tool's line format ("… —
 * stated by the user on YYYY-MM-DD") so the classifier sees the same
 * attribution the response model later quotes. Empty input → undefined (no
 * block).
 */
export function buildMemoryProbeSection(
  points: Array<Pick<MemoryPoint, 'text' | 'role' | 'createdAt'>>,
): string | undefined {
  if (points.length === 0) return undefined;

  const body = points.map((point) => `- ${formatProvenanceLine(point)}`).join('\n');
  const capped = body.length > MEMORY_PROBE_CHAR_LIMIT ? `${body.slice(0, MEMORY_PROBE_CHAR_LIMIT)}…` : body;

  return `MEMORY PROBE — YOUR long-term memory of this user, retrieved for THIS request. These are trusted statements the user made or asked you to remember in past conversations (never public web knowledge). Each line carries its origin and date; weigh recency against the current date/time. Use them to resolve what the user is referring to, but never treat them as the current request itself.
${capped}`;
}
