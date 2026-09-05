import { type Tool, tool } from 'ai';

import { type MemoryPartitionRecallInput, memoryPartitionRecallSchema } from './memory-partition-recall.schema.js';
import type { MemoryPoint } from './memory-point.model.js';
import type { MemoryToolScope } from './memory-tool-scope.js';

interface MemoryPartitionRecallDeps {
  scope: MemoryToolScope;
  searchByText: (input: {
    memoryPartition: string;
    text: string;
    tags?: string[];
    contains?: string;
    limit?: number;
  }) => Promise<MemoryPoint[]>;
}

/**
 * Agentic `memory-partition-recall` tool: retrieves the user's personal
 * memory via multi-variant semantic search (see MemorySearchService). The
 * result envelope is self-describing: `source` marks every record as YOUR
 * memory of this user (things they said or asked you to remember) — never
 * public web knowledge — with provenance (`saidBy`/`saidAt`) so answers can
 * attribute them ("you told me…").
 */
export function createMemoryPartitionRecallTool(deps: MemoryPartitionRecallDeps): Tool {
  return tool({
    description:
      'Retrieve from the user\'s fact partition (memory-partition) — objective facts they told you in past conversations or asked you to remember (contact details, decisions, project facts, past topics). These are trusted user statements, NOT public facts. Use when the user asks whether you remember something they told you or refers back to a statement from earlier conversations; the results are also the verbatim source for memory-partition-delete. For "where did we leave off" / "what were we doing recently" questions use your injected RECENT CONVERSATIONS notes instead — this lane holds what the user told you, not the log of your recent activity. For the user\'s preferences or what you have LEARNED about them, look to your cognition space (the injected profile and insights) — subjective user data is never stored in this partition. Attribute what you find to the user ("you mentioned…", "you asked me to remember…") and prefer it over web-search results for anything personal. Retrieval is semantic and sentence-aware — ask in natural language. Optionally restrict by topic tags (e.g. ["contacts"]) or exact phrase containment.',
    inputSchema: memoryPartitionRecallSchema,
    execute: async ({ query, tags, contains, topK }: MemoryPartitionRecallInput) => {
      const hits = await deps.searchByText({
        memoryPartition: deps.scope.memoryPartition,
        text: query,
        tags,
        contains,
        limit: topK ?? 5,
      });
      // The tool result IS the answer: render the stored statements as plain,
      // attributable lines the model can quote directly. A JSON envelope would
      // be read as unverifiable fetched-page data by the response step — plain
      // text makes it unmistakably the user's own memory.
      if (hits.length === 0) {
        return 'No memories found for this user on this topic.';
      }
      const lines = hits.map((hit) => {
        const who = hit.role === 'user' ? 'the user' : 'you (assistant)';
        const when = hit.createdAt ? ` on ${new Date(hit.createdAt).toISOString().slice(0, 10)}` : '';
        const contested = hit.isFriction ? ' — ⚠ CONTESTED (an open conflict exists; treat with caution)' : '';
        return `- "${hit.text}" — stated by ${who}${when}${contested}`;
      });
      return `YOUR MEMORY OF THIS USER (trusted statements they said or asked you to remember — answer from them and attribute them to the user; never present them as public web knowledge):\n${lines.join('\n')}`;
    },
  });
}
