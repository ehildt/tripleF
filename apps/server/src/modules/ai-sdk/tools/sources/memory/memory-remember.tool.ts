import { tool } from 'ai';

import {
  type MemoryRememberInput,
  memoryRememberSchema,
} from './memory-remember.schema.js';

/** Partition-scoped binding for the memory tools, threaded per request. */
export interface MemoryToolScope {
  /** Fact partition the tools read from/write to — the user-set partition id when configured, else the session id. */
  memoryPartition: string;
  /** Cognition space key — the AI's understanding-of-the-user lane (memoryDelete cognition mode); falls back to the fact partition. */
  memoryCognition?: string;
  /** Origin session — stored as provenance on remembers. */
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — remembers are traced back to the requesting turn. */
  requestId?: string;
}

interface MemoryRememberDeps {
  scope: MemoryToolScope;
  storeRecord: (input: {
    memoryPartition: string;
    sessionId?: string;
    conversationId?: string;
    requestId?: string;
    text: string;
    tags?: string[];
  }) => Promise<string>;
}

/**
 * Agentic `memoryRemember` tool: stores notable facts about subjects the user
 * cares about (favorites, interests, projects), preferences they state, and
 * anything they explicitly ask to remember. Storing gathered knowledge and
 * noticed preferences is expected — not gated on an explicit "remember"
 * instruction. Stores one record synchronously (embed + upsert, deterministic
 * id so re-remembering the same text updates it) — the text IS the record, and
 * the model-written tags are the filter vocabulary for later recall.
 */
export function createMemoryRememberTool(deps: MemoryRememberDeps) {
  return tool({
    description:
      'Store into YOUR long-term memory of this user: notable facts about subjects they care about (favorites, interests, projects, followed stocks, people, past topics), preferences and durable details they state, and anything they explicitly ask you to remember. Storing gathered knowledge and noticed preferences is expected — do not wait for an explicit "remember" instruction. This memory outlives the conversation and is recalled later with memoryRecall. STORAGE MECHANICS: each record is embedded as a whole and matched sentence-by-sentence at recall time — write ONE self-contained statement per call (a single dense sentence is fine, subject up front), restating a record verbatim updates it in place, and tags are the recall filter vocabulary (lowercase, reusable).',
    inputSchema: memoryRememberSchema,
    execute: async ({ text, tags }: MemoryRememberInput) => {
      try {
        const id = await deps.storeRecord({
          memoryPartition: deps.scope.memoryPartition,
          sessionId: deps.scope.sessionId,
          conversationId: deps.scope.conversationId,
          requestId: deps.scope.requestId,
          text,
          tags,
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
