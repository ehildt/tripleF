import { normalizeCategory } from '../../../memory-partition/helpers/normalize-category.helper.js';
import {
  DENSE_VECTOR,
  SPARSE_VECTOR,
} from '../../constants/qdrant.constants.js';
import { buildSparseVector } from '../../helpers/build-sparse-vector.helper.js';
import { normalizeCommunity } from '../../helpers/normalize-community.helper.js';
import type { CollectionVectorLayout } from '../../models/collection-vector-layout.model.js';
import type { UpsertBatchInput } from '../../models/memory.model.js';

type UpsertPoint = UpsertBatchInput['points'][number];

/** Build one Qdrant upsert point from a memory point and its batch input. */
export function mapMemoryPointToUpsert(
  point: UpsertPoint,
  input: UpsertBatchInput,
  createdAt: string,
  layout: CollectionVectorLayout,
) {
  return {
    id: point.id,
    vector: layout.named
      ? {
          [DENSE_VECTOR]: point.vector,
          ...(layout.sparse && point.text.trim()
            ? { [SPARSE_VECTOR]: buildSparseVector(point.text) }
            : {}),
        }
      : point.vector,
    payload: {
      memory_partition: input.memoryPartition,
      memory_cognition: input.memoryCognition,
      session_id: input.sessionId,
      role: input.role,
      conversation_id: input.conversationId,
      request_id: input.requestId,
      text: point.text,
      tags: point.tags ?? [],
      // Every write boundary funnels through here — the category is
      // normalized once, so case/format drift cannot re-enter the system.
      category: normalizeCategory(point.category),
      community: normalizeCommunity(point.community),
      // The chain's hub/node tier keys plus the extraction-classified
      // maintenance knobs — arrive normalized from the extraction parse or
      // the remember tool's strict storeRecord path.
      subject: point.subject,
      node: point.node,
      kind: point.kind,
      stability: point.stability,
      path: point.path,
      files: input.files ?? [],
      created_at: createdAt,
      is_consolidated: point.isConsolidated,
      is_linked: point.isLinked,
      is_reflected: point.isReflected,
      is_synthesized: point.isSynthesized,
      is_friction: point.isFriction,
      superseded: point.superseded,
      superseded_by: point.supersededBy,
      evidence_ids: point.evidenceIds,
    },
  };
}
