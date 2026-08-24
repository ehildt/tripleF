import type { MemoryPoint } from '../models/memory.model.js';

/** Cap on the rendered prior-memory block — keeps the extraction prompt cheap. */
const PRIOR_MEMORY_CHAR_LIMIT = 1200;

/**
 * Render prior-memory hits as an "ALREADY STORED" block for the extraction
 * prompt. Each line carries the record text plus its origin (who stated it,
 * when) so the model can judge coverage and provenance. Empty input → undefined
 * (the caller appends nothing).
 */
export function buildPriorMemorySection(
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
    body.length > PRIOR_MEMORY_CHAR_LIMIT
      ? `${body.slice(0, PRIOR_MEMORY_CHAR_LIMIT)}…`
      : body;
  return `ALREADY STORED IN MEMORY — facts already in YOUR long-term memory of this user from prior turns (each with origin and date):
${capped}`;
}
