import { type Tool, tool } from 'ai';

import { type MemoryTaxonomyProbeInput, memoryTaxonomyProbeSchema } from './memory-taxonomy-probe.schema.js';

/** One probe candidate as handed back to the model. */
export interface MemoryTaxonomyProbeCandidate {
  /** Registry node id — reusable as `parentId` for the next tier's probe. */
  id: string;
  /** Canonical label — adopt it VERBATIM when it fits. */
  name: string;
  /** Fused similarity (0..1): name match and/or meaning. */
  score: number;
  /** What belongs under the label (when recorded). */
  summary?: string;
  /** The node's icon (when set) — never re-suggest an icon on adopt. */
  icon?: string;
}

/** Probe outcome the tool returns to the model. */
export interface MemoryTaxonomyProbeResult {
  kind: MemoryTaxonomyProbeInput['kind'];
  query: string;
  candidates: MemoryTaxonomyProbeCandidate[];
  /** The pick-or-create instruction, phrased for the model. */
  guidance: string;
}

interface MemoryTaxonomyProbeDeps {
  probe: (input: MemoryTaxonomyProbeInput) => Promise<MemoryTaxonomyProbeResult>;
}

/**
 * Agentic `memory-taxonomy-probe` tool: the iterative, top-down semantic
 * probe over the macro-taxonomy (cluster → community → hub). Before naming a
 * label, the model probes the tier, then either ADOPTS a returned candidate
 * (names it verbatim downstream; its id becomes the next probe's `parentId`)
 * or CREATES a new, phrasing-compliant label when nothing fits. The taxonomy
 * is read-only for the model — probing never mutates it.
 */
export function createMemoryTaxonomyProbeTool(deps: MemoryTaxonomyProbeDeps): Tool {
  return tool({
    description:
      'Probe the macro-taxonomy before naming a label — MANDATORY before any community or hub you are not already certain exists. Work top-down: first probe kind="cluster" with the family label you intend; ADOPT a returned candidate by using its name verbatim (keep its id for the next probe), or CREATE when nothing fits. Then probe kind="community" with parentId = the cluster id (omit parentId when you are creating the cluster), then kind="hub" with parentId = the community or cluster id above it. Creation phrasing: cluster/community are PLURAL family nouns, never a specific entity or title; a hub is the SINGULAR main subject entity. The taxonomy is read-only: never invent a near-duplicate of a listed candidate — name the candidate VERBATIM.',
    inputSchema: memoryTaxonomyProbeSchema,
    execute: async (input: MemoryTaxonomyProbeInput) => {
      try {
        return await deps.probe(input);
      } catch (error) {
        return {
          kind: input.kind,
          query: input.query,
          candidates: [],
          guidance: `Probe failed (${error instanceof Error ? error.message : 'unknown error'}) — fall back to the phrasing rules and create the label.`,
        };
      }
    },
  });
}
