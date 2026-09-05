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
 * Agentic `memory-cognition-remember` tool: stores one insight into the AI's
 * cognition space — the EXCLUSIVE store for subjective user data. It holds
 * both what the user STATES about themselves (preferences, interests, likes
 * and dislikes) and what the model DERIVES (inferred traits, standing
 * interests, working nuances, connections between facts). Distinct from the
 * fact partition: objective facts (contact info, decisions, project details,
 * events) belong in memory-partition-remember, subjective user data belongs
 * here — never the other way around. Stores one record synchronously (embed
 * + upsert, deterministic id so re-stating the same insight updates it in
 * place).
 */
export function createMemoryCognitionRememberTool(deps: MemoryCognitionRememberDeps): Tool {
  return tool({
    description:
      'Store one insight into your cognition space (memory-cognition) — the exclusive store for SUBJECTIVE user data: preferences and interests the user STATES ("the user likes…", "the user is interested in…") plus what you LEARN about them (inferred traits, standing interests, working nuances, connections between facts). Objective facts (contact info, decisions, project details, events) belong in memory-partition-remember, never here. One self-contained third-person sentence per call, lead with the topic. Optionally attach a path (e.g. "likes.cars") when the insight deepens a stored profile value. Restating an insight verbatim updates it in place.',
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
