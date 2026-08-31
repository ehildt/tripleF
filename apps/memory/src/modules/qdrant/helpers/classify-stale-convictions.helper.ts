/** One synthesized statement's evidence back-references (the drift-check input). */
interface ConvictionEvidenceRef {
  id: string;
  evidenceIds: string[];
}

/** One evidence point's superseded state (the drift-check lookup). */
interface EvidenceState {
  id: string;
  superseded: boolean;
}

/** The drift sweep outcome: which statements to supersede and what to re-offer. */
interface StaleConvictionSweep {
  staleConvictionIds: string[];
  reofferIds: string[];
}

/**
 * Evidence-drift invariant (G4): a synthesized statement is stale iff any of
 * its `evidence_ids` is missing or superseded. This pure classifier splits
 * the scanned convictions/bridges into stale (supersede) and surviving
 * evidence (re-offer for re-synthesis) — the model proposes, the system
 * disposes.
 */
export function classifyStaleConvictions(
  convictions: readonly ConvictionEvidenceRef[],
  state: readonly EvidenceState[],
): StaleConvictionSweep {
  const present = new Set(state.map((item) => item.id));
  const superseded = new Set(
    state.filter((item) => item.superseded).map((item) => item.id),
  );
  const staleConvictionIds: string[] = [];
  const reofferIds = new Set<string>();
  for (const conviction of convictions) {
    const stale = conviction.evidenceIds.some(
      (id) => !present.has(id) || superseded.has(id),
    );
    if (!stale) continue;
    staleConvictionIds.push(conviction.id);
    for (const id of conviction.evidenceIds) {
      if (present.has(id) && !superseded.has(id)) reofferIds.add(id);
    }
  }
  return { staleConvictionIds, reofferIds: [...reofferIds] };
}
