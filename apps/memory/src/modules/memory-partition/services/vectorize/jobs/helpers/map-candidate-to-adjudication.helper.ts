import type { MemoryRole } from '../../../../../qdrant/models/memory.model.js';

/** Project a candidate point into the adjudication-input shape. */
export function mapCandidateToAdjudication(candidate: {
  text: string;
  role: MemoryRole;
  createdAt: string;
  subject?: string;
  category?: string;
  kind?: string;
  stability?: string;
}) {
  return {
    text: candidate.text,
    role: candidate.role,
    createdAt: candidate.createdAt,
    subject: candidate.subject,
    category: candidate.category,
    kind: candidate.kind,
    stability: candidate.stability,
  };
}
