import { type Tool, tool } from 'ai';

import {
  type MemoryPartitionRememberInput,
  memoryPartitionRememberSchema,
} from './memory-partition-remember.schema.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

interface MemoryPartitionRememberDeps {
  scope: MemoryToolScope;
  storeRecord: (input: {
    memoryPartition: string;
    sessionId?: string;
    conversationId?: string;
    requestId?: string;
    text: string;
    tags?: string[];
    category?: string;
  }) => Promise<string>;
}

/**
 * Agentic `memory-partition-remember` tool: stores OBJECTIVE facts — notable
 * external-world facts about subjects the user cares about (projects,
 * followed stocks, games, people, past topics), objective details they state
 * as fact (contact info, decisions, constraints, their setup), and objective
 * facts they explicitly ask to remember — into the fact partition lane.
 * Subjective user data (preferences, interests, traits, internal states) is
 * barred here: it belongs to the cognition lane (memory-cognition-remember).
 * Storing gathered knowledge is expected — not gated on an explicit
 * "remember" instruction. Stores one record synchronously (embed + upsert,
 * deterministic id so re-remembering the same text updates it) — the text IS
 * the record, and the model-written tags are the filter vocabulary for later
 * recall.
 */
export function createMemoryPartitionRememberTool(deps: MemoryPartitionRememberDeps): Tool {
  return tool({
    description:
      'Store into the user\'s fact partition (memory-partition) — OBJECTIVE facts only: notable external-world facts about subjects they care about (projects, followed stocks, games, people, past topics), objective details they state as fact (contact info, decisions, constraints, their setup), and objective facts they explicitly ask you to remember. You MUST NOT store subjective user data here — preferences, interests, likes/dislikes, behavioral traits, or internal states ("the user likes…") belong to the cognition tier (memory-cognition-remember). Storing gathered knowledge is expected — do not wait for an explicit "remember" instruction. This memory outlives the conversation and is recalled later with memory-partition-recall. STORAGE MECHANICS: each record is embedded as a whole and matched sentence-by-sentence at recall time — write ONE self-contained statement per call (a single dense sentence is fine, subject up front), restating a record verbatim updates it in place, tags are the recall filter vocabulary (lowercase, reusable), and `category` is one broad family label (games, pets, work, health …) that groups narrow tags into one topic family — always include both.',
    inputSchema: memoryPartitionRememberSchema,
    execute: async ({ text, tags, category }: MemoryPartitionRememberInput) => {
      try {
        const id = await deps.storeRecord({
          memoryPartition: deps.scope.memoryPartition,
          sessionId: deps.scope.sessionId,
          conversationId: deps.scope.conversationId,
          requestId: deps.scope.requestId,
          text,
          tags,
          category,
        });
        return { stored: true, id };
      } catch (error) {
        return {
          stored: false,
          error: error instanceof Error ? error.message : 'memory store failed',
        };
      }
    },
  });
}
