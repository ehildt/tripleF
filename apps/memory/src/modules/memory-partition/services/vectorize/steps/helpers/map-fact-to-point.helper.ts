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
    // Per-fact family label first, turn-side label as the backstop — groups
    // the narrow tags into one topic family for the constellation topic tier
    // and the relink job's per-category passes.
    category: fact.category ?? extraction.category,
    // Per-fact sub-family first, turn-side community as the backstop — the
    // tier between the cluster and the hub.
    community: fact.community ?? extraction.community,
    // The extraction-classified maintenance knobs (subject / kind /
    // stability) — the consolidate/reflect/conviction passes read them.
    subject: fact.subject,
    kind: fact.kind,
    stability: fact.stability,
  };
}
