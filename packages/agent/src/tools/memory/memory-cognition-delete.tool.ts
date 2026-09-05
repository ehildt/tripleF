import { type Tool, tool } from 'ai';

import { type MemoryCognitionDeleteInput, memoryCognitionDeleteSchema } from './memory-cognition-delete.schema.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

export interface MemoryCognitionDeleteOutcome {
  deleted: number;
  texts: string[];
  pruned: string[];
}

interface MemoryCognitionDeleteDeps {
  scope: MemoryToolScope;
  deleteCognitionRecords: (input: {
    memoryCognition: string;
    text?: string;
    path?: string;
  }) => Promise<MemoryCognitionDeleteOutcome>;
}

/**
 * Agentic `memory-cognition-delete` tool: the TARGETED forget path for the
 * cognition lane — one verbatim insight record (exact text, quoted from the
 * injected cognition context) and/or one profile routing topic (by
 * `field.keyword` path, e.g. "likes.jazz"). This is the per-item answer to
 * "forget that I like…"; the whole-space wipe stays
 * `memory-cognition-forget`'s job. Deletion is confirmed with the removed
 * texts and pruned topics; zero matches is an honest no-op, and store
 * failures return an error envelope instead of throwing.
 */
export function createMemoryCognitionDeleteTool(deps: MemoryCognitionDeleteDeps): Tool {
  return tool({
    description:
      'Delete one targeted piece of your cognition space (memory-cognition): pass the verbatim insight text from your injected cognition context to delete that stored insight, and/or a profile path ("field.keyword", e.g. "likes.jazz") to prune that standing topic from your structured profile. Use when the user asks to forget a preference, an interest, or any other subjective profile datum — the per-item forget for the cognition lane. To forget EVERYTHING you know about the user instead (profile AND all insights), use memory-cognition-forget. Deletion is permanent; the result confirms exactly what was removed.',
    inputSchema: memoryCognitionDeleteSchema,
    execute: async ({ text, path }: MemoryCognitionDeleteInput) => {
      try {
        if (!text && !path) {
          return {
            deleted: 0,
            pruned: [],
            error: 'Pass text (verbatim insight) and/or path (profile topic) — a targeted delete needs at least one.',
          };
        }
        const outcome = await deps.deleteCognitionRecords({
          memoryCognition: deps.scope.memoryCognition ?? deps.scope.memoryPartition,
          text,
          path,
        });
        return outcome.deleted > 0 || outcome.pruned.length > 0
          ? { deleted: outcome.deleted, removed: outcome.texts, pruned: outcome.pruned }
          : {
              deleted: 0,
              pruned: [],
              message:
                'No stored insight matches that exact text or path — quote the insight verbatim from your injected cognition context, or name the profile path exactly (e.g. "likes.jazz").',
            };
      } catch (error) {
        return {
          deleted: 0,
          pruned: [],
          error: error instanceof Error ? error.message : 'cognition delete failed',
        };
      }
    },
  });
}
