import { tool } from 'ai';

import {
  type MemoryDeleteInput,
  memoryDeleteSchema,
} from './memory-delete.schema.js';
import { type MemoryToolScope } from './memory-remember.tool.js';

interface MemoryDeleteDeps {
  scope: MemoryToolScope;
  deleteRecords: (input: {
    memoryPartition: string;
    text?: string;
  }) => Promise<{ deleted: number; texts: string[]; matched: number }>;
  deleteCognition: (memoryCognition: string) => Promise<string[]>;
}

/**
 * Agentic `memoryDelete` tool: the forget path for long-term memory. Two
 * bounded modes, never fuzzy:
 * - `text` — delete one exact fact record, quoted verbatim from a preceding
 *   memoryRecall result (record texts ARE the record identity: the store's
 *   deterministic ids make the verbatim statement addressable, so no ids are
 *   exposed and no semantic guessing is involved).
 * - `cognition: true` — wipe the AI's living understanding-of-the-user
 *   document when the user asks to forget them or start over.
 *
 * Bulk/wipe-all is deliberately NOT offered here (settings/REST surface
 * only). Deletion is confirmed with the removed verbatim texts so the answer
 * can state exactly what was forgotten; zero matches is an honest no-op, and
 * store failures return an error envelope instead of throwing.
 */
export function createMemoryDeleteTool(deps: MemoryDeleteDeps) {
  return tool({
    description:
      'Delete from YOUR long-term memory of this user. Pass text — one exact stored statement quoted verbatim from a memoryRecall result — to delete that fact record. Pass cognition:true ONLY when the user asks you to forget your learned understanding of them or to start over (wipes your entire cognition space of the user: the structured profile AND every derived insight). Never delete on a guess: recall first with memoryRecall, then delete the verbatim statement. Deletion is permanent; the result confirms exactly what was removed.',
    inputSchema: memoryDeleteSchema,
    execute: async ({ text, cognition }: MemoryDeleteInput) => {
      if (cognition === true) {
        try {
          const removed = await deps.deleteCognition(
            deps.scope.memoryCognition ?? deps.scope.memoryPartition,
          );
          return removed.length > 0
            ? {
                deleted: removed.length,
                removed,
                note: 'Your cognition space of this user was wiped (profile and insights) — understanding is forgotten, fact records are untouched.',
              }
            : {
                deleted: 0,
                message: 'No cognition exists for this user.',
              };
        } catch (error) {
          return {
            deleted: 0,
            error:
              error instanceof Error
                ? error.message
                : 'cognition delete failed',
          };
        }
      }
      if (!text) {
        return {
          deleted: 0,
          error:
            'Provide exactly one of the two modes: text (verbatim record) or cognition:true.',
        };
      }
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
                'No stored record matches that exact text — use memoryRecall to find the verbatim statement first.',
            };
      } catch (error) {
        return {
          deleted: 0,
          error:
            error instanceof Error ? error.message : 'memory delete failed',
        };
      }
    },
  });
}
