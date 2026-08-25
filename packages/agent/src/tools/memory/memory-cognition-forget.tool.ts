import { type Tool, tool } from 'ai';

import { memoryCognitionForgetSchema } from './memory-cognition-forget.schema.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

interface MemoryCognitionForgetDeps {
  scope: MemoryToolScope;
  deleteCognition: (memoryCognition: string) => Promise<string[]>;
}

/**
 * Agentic `memory-cognition-forget` tool: wipes the AI's living
 * understanding-of-the-user document when the user asks to forget them or
 * start over. Fact records in the partition are untouched — this lane is the
 * cognition space only (structured profile + derived insights).
 */
export function createMemoryCognitionForgetTool(deps: MemoryCognitionForgetDeps): Tool {
  return tool({
    description:
      'Wipe your entire cognition space (memory-cognition) of the user — the structured profile AND every derived insight — ONLY when the user asks you to forget your learned understanding of them or to start over. Fact records in the partition are untouched. Deletion is permanent; the result confirms exactly what was removed.',
    inputSchema: memoryCognitionForgetSchema,
    execute: async () => {
      try {
        const removed = await deps.deleteCognition(deps.scope.memoryCognition ?? deps.scope.memoryPartition);
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
          error: error instanceof Error ? error.message : 'cognition delete failed',
        };
      }
    },
  });
}
