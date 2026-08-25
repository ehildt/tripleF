import type { MemoryPoint } from '../models/memory.model.js';

/**
 * Render prior-memory hits as an "ALREADY STORED" block for the extraction
 * prompt. Each line carries the record text plus its origin (who stated it,
 * when) so the model can judge coverage and provenance. Empty input → undefined
 * (the caller appends nothing). Full fidelity — the probe is bounded upstream
 * (limit 6), so no char cap here.
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
  return `ALREADY STORED IN MEMORY — facts already in YOUR long-term memory of this user from prior turns (each with origin and date):
${body}`;
}
