import type { Prisma } from '../../../../generated/prisma/client.js';
import type { MemoryTaxonomyNodeInput } from '../memory-taxonomy.repository.types.js';

/** The compound unique lookup of one node input. */
export function buildTaxonomyNodeUniqueKey(
  input: MemoryTaxonomyNodeInput,
): Prisma.MemoryTaxonomyNodeWhereUniqueInput {
  return {
    lane_scopeKey_kind_parentId_normalizedName: {
      lane: input.lane,
      scopeKey: input.scopeKey,
      kind: input.kind,
      parentId: input.parentId,
      normalizedName: input.normalizedName,
    },
  };
}
