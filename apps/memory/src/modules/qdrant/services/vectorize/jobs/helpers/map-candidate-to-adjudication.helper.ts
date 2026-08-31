import type { MemoryRole } from '../../../../models/memory.model.js';

/** Project a candidate point into the adjudication-input shape. */
export function mapCandidateToAdjudication(candidate: {
  text: string;
  role: MemoryRole;
  createdAt: string;
}) {
  return {
    text: candidate.text,
    role: candidate.role,
    createdAt: candidate.createdAt,
  };
}
