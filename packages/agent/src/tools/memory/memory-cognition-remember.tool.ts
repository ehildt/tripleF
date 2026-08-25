import { type Tool, tool } from 'ai';

import {
  type MemoryCognitionRememberInput,
  memoryCognitionRememberSchema,
} from './memory-cognition-remember.schema.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

interface MemoryCognitionRememberDeps {
  scope: MemoryToolScope;
  storeInsight: (input: {
    memoryCognition: string;
    sessionId?: string;
    conversationId?: string;
    requestId?: string;
    text: string;
    path?: string;
  }) => Promise<string>;
}

/**
 * Agentic `memory-cognition-remember` tool: stores one derived insight into
 * the AI's cognition space — the model's own understanding of the user
 * (inferred traits, standing interests, working nuances, connections between
 * facts). Distinct from the fact partition: stated facts belong in
 * memory-partition-remember, derived understanding belongs here. Stores one
 * record synchronously (embed + upsert, deterministic id so re-stating the
 * same insight updates it in place).
 */
export function createMemoryCognitionRememberTool(deps: MemoryCognitionRememberDeps): Tool {
  return tool({
    description:
      'Store one derived insight into your cognition space (memory-cognition) — your own understanding of the user (inferred traits, standing interests, working nuances, connections between facts). Use for what you LEARN about the user, not what they stated; stated facts belong in memory-partition-remember. One self-contained third-person sentence per call, lead with the topic. Optionally attach a path (e.g. "likes.cars") when the insight deepens a stored profile value. Restating an insight verbatim updates it in place.',
    inputSchema: memoryCognitionRememberSchema,
    execute: async ({ text, path }: MemoryCognitionRememberInput) => {
      try {
        const id = await deps.storeInsight({
          memoryCognition: deps.scope.memoryCognition ?? deps.scope.memoryPartition,
          sessionId: deps.scope.sessionId,
          conversationId: deps.scope.conversationId,
          requestId: deps.scope.requestId,
          text,
          path,
        });
        return { stored: true, id };
      } catch (error) {
        return {
          stored: false,
          error: error instanceof Error ? error.message : 'cognition store failed',
        };
      }
    },
  });
}
