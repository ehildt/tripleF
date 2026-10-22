import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.types.js';
import type {
  TaxonomyLabelInput,
  TaxonomyResolvedLabel,
} from '../services/taxonomy-resolution.service.types.js';

/** Build the resolution outcome of one label snapping onto one node. */
export function buildResolutionOutcome(
  entry: TaxonomyLabelInput,
  node: MemoryTaxonomyNodeRecord,
  how: TaxonomyResolvedLabel['how'],
  score?: number,
): TaxonomyResolvedLabel {
  return {
    kind: entry.kind,
    input: entry.label,
    name: node.name,
    nodeId: node.id,
    how,
    score,
  };
}
