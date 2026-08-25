import { type Tool, tool } from 'ai';

import { type MemoryPartitionDeleteInput, memoryPartitionDeleteSchema } from './memory-partition-delete.schema.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

interface MemoryPartitionDeleteDeps {
  scope: MemoryToolScope;
  deleteRecords: (input: {
    memoryPartition: string;
    text?: string;
  }) => Promise<{ deleted: number; texts: string[]; matched: number }>;
}

/**
 * Agentic `memory-partition-delete` tool: the forget path for the fact
 * partition. Deletes one exact fact record, quoted verbatim from a preceding
 * memory-partition-recall result (record texts ARE the record identity: the
 * store's deterministic ids make the verbatim statement addressable, so no
 * ids are exposed and no semantic guessing is involved).
 *
 * Bulk/wipe-all is deliberately NOT offered here (settings/REST surface
 * only). Deletion is confirmed with the removed verbatim texts so the answer
 * can state exactly what was forgotten; zero matches is an honest no-op, and
 * store failures return an error envelope instead of throwing.
 */
export function createMemoryPartitionDeleteTool(deps: MemoryPartitionDeleteDeps): Tool {
  return tool({
    description:
      "Delete one exact fact record from the user's fact partition (memory-partition), quoted verbatim from a memory-partition-recall result. Record texts ARE the record identity — no ids needed. Never delete on a guess: recall first with memory-partition-recall, then delete the verbatim statement. Deletion is permanent; the result confirms exactly what was removed.",
    inputSchema: memoryPartitionDeleteSchema,
    execute: async ({ text }: MemoryPartitionDeleteInput) => {
      try {
        const outcome = await deps.deleteRecords({
          memoryPartition: deps.scope.memoryPartition,
          text,
        });
        return outcome.deleted > 0
          ? { deleted: outcome.deleted, removed: outcome.texts }
          : {
              deleted: 0,
              message:
                'No stored record matches that exact text — use memory-partition-recall to find the verbatim statement first.',
            };
      } catch (error) {
        return {
          deleted: 0,
          error: error instanceof Error ? error.message : 'memory delete failed',
        };
      }
    },
  });
}
