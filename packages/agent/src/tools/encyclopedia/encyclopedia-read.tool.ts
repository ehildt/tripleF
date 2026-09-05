import { type Tool, tool } from 'ai';

import type { EncyclopediaDocumentResult } from '../../schemas/encyclopedia-document.model.js';

import { encyclopediaReadSchema, type EncyclopediaReadToolInput } from './encyclopedia-read.schema.js';

interface EncyclopediaReadDeps {
  readDocument: (input: {
    url: string;
    offset?: number;
    maxChars?: number;
  }) => Promise<EncyclopediaDocumentResult | null>;
}

/**
 * Agentic `encyclopedia-read` tool: the document deep-dive follow-up to
 * encyclopedia-search. A search hit is a fragment of its document; this
 * tool pulls the document's stored content in original order (windowed,
 * continuation via `startChunk`) — a fetched page's full text or an
 * uploaded document's extracted text — without a live fetch. Always offered
 * alongside encyclopedia-search when memory is enabled.
 */
export function createEncyclopediaReadTool(deps: EncyclopediaReadDeps): Tool {
  return tool({
    description:
      'Read one knowledge-base document in original order — the deep-dive follow-up to encyclopedia-search. Pass a result\u2019s exact url to pull the surrounding and remaining content of that document (a fetched page, or the extracted text of an uploaded PDF, receipt, or instruction document) without a live fetch. Use it when a knowledge-base passage looks incomplete, when the user asks for more detail or a deep dive into one stored document, or to scan the whole document section by section. Returns a verbatim window; when the footer says more content follows, call again with startChunk set to the named next index to continue reading.',
    inputSchema: encyclopediaReadSchema,
    execute: async ({ url, startChunk, maxChars }: EncyclopediaReadToolInput) => {
      const result = await deps.readDocument({ url, offset: startChunk, maxChars });
      if (!result) {
        return 'No document found in the knowledge base for this url — pass the exact url of an encyclopedia-search result.';
      }
      const footer = result.hasMore
        ? `More of this document follows — call encyclopedia-read again with startChunk=${result.toChunk + 1} to continue.`
        : `End of document (${result.totalChunks} chunks total).`;
      const title = result.title ? ` "${result.title}"` : '';
      // Verbatim window as plain provenance text (see the search tool) —
      // the document's own words, citeable through its url.
      return `YOUR KNOWLEDGE BASE — DOCUMENT${title} — ${result.url}\nVerbatim content, chunks ${result.fromChunk + 1}–${result.toChunk + 1} of ${result.totalChunks} (cite this url when you use it; upload urls open/download the original file):\n${result.content}\n\n${footer}`;
    },
  });
}
