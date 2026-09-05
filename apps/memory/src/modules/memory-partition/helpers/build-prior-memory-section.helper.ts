import { formatProvenanceLine } from '@triplef/agent/prompts';

import type { MemoryPoint } from '../../qdrant/models/memory.model.js';

/**
 * Render prior-memory hits as an "ALREADY STORED" block for the extraction
 * prompt. Each line carries the record text plus its origin (who stated it,
 * when) so the model can judge coverage and provenance — the shared
 * formatProvenanceLine keeps the wording identical to the harness's memory
 * probe and the consolidation adjudicator. Empty input → undefined (the
 * caller appends nothing). Full fidelity — the probe is bounded upstream
 * (limit 6), so no char cap here.
 */
export function buildPriorMemorySection(
  points: MemoryPoint[],
): string | undefined {
  if (points.length === 0) return undefined;
  const body = points
    .map((point) => `- ${formatProvenanceLine(point)}`)
    .join('\n');
  return `ALREADY STORED IN MEMORY — facts already in YOUR long-term memory of this user from prior turns (each with origin and date):
${body}`;
}
