import type { ExtractedFact, MemoryExtraction } from '@triplef/agent/schemas';

import { deterministicPointId } from '../../../../../qdrant/helpers/deterministic-point-id.helper.js';

/** Assemble one memory point from an extracted fact. */
export function mapFactToPoint(
  fact: ExtractedFact,
  index: number,
  vectors: number[][],
  extraction: MemoryExtraction,
  memoryPartition: string,
  role: string,
) {
  return {
    id: deterministicPointId(`${memoryPartition}|${role}|${fact.text}`),
    vector: vectors[index],
    text: fact.text,
    tags: extraction.tags,
    // The strict taxonomy chain — every label lands on the point's flat
    // payload so counts and leaf listings stay join-free.
    category: fact.category,
    community: fact.community,
    subject: fact.subject,
    node: fact.node,
    // The extraction-classified maintenance knobs (kind / stability) — the
    // consolidate/reflect/conviction passes read them.
    kind: fact.kind,
    stability: fact.stability,
  };
}
