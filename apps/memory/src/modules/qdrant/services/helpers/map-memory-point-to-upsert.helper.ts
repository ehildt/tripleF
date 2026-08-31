import { normalizeCategory } from '../../helpers/normalize-category.helper.js';
import type { UpsertBatchInput } from '../../models/memory.model.js';

type UpsertPoint = UpsertBatchInput['points'][number];

/** Build one Qdrant upsert point from a memory point and its batch input. */
export function mapMemoryPointToUpsert(
  point: UpsertPoint,
  input: UpsertBatchInput,
  createdAt: string,
) {
  return {
    id: point.id,
    vector: point.vector,
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
      path: point.path,
      files: input.files ?? [],
      created_at: createdAt,
    },
  };
}
