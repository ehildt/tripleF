import { type Tool, tool } from 'ai';

import type { EncyclopediaSearchHit } from '../../schemas/encyclopedia-search.model.js';

import { encyclopediaSearchSchema, type EncyclopediaSearchToolInput } from './encyclopedia-search.schema.js';

interface EncyclopediaSearchDeps {
  search: (input: { text: string; url?: string; domain?: string; limit?: number }) => Promise<EncyclopediaSearchHit[]>;
}

/**
 * Agentic `encyclopedia-search` tool: semantic search over the knowledge
 * base — verbatim passages of pages fetched and documents uploaded in
 * earlier sessions (web sources, PDFs, receipts, instruction documents).
 * The result envelope is self-describing: every passage carries its source
 * url (uploads link to the downloadable original file) plus the document
 * coordinates (`chunk N of M`) the encyclopedia-read tool deep-dives from.
 * Always offered in the execute wave when memory is enabled — the model
 * itself decides when to consult what it already knows, chained after the
 * memory probe and alongside (never instead of) live web search.
 */
export function createEncyclopediaSearchTool(deps: EncyclopediaSearchDeps): Tool {
  return tool({
    description:
      'Search your knowledge base (encyclopedia): VERBATIM passages from webpages you fetched and documents the user uploaded in past sessions — each with its source url (upload urls open/download the original file) and the fetch date as the freshness signal. Consult it whenever a request might be answerable from knowledge you already have, and cite the url/title of what you use. It complements live web search, never replaces it: weigh the dates, and still search the web when recency, updates, or coverage gaps matter — fresh fetches are how this knowledge base closes its gaps and stays current. Scope options: pass a known result url to search within that one document only, or a domain to search one source. Passages may be fragments — pass a result url to the encyclopedia-read tool to pull the surrounding or full document (PDF, receipt, instructions).',
    inputSchema: encyclopediaSearchSchema,
    execute: async ({ query, topK, url, domain }: EncyclopediaSearchToolInput) => {
      const hits = await deps.search({ text: query, url, domain, limit: topK ?? 5 });
      if (hits.length === 0) {
        return url
          ? 'No matching knowledge found inside that document — check the url, or fall back to a live web search/fetch.'
          : 'No matching knowledge found in your knowledge base (no previously fetched page or uploaded document matched). Answer from a live web search instead — its sources also grow the knowledge base.';
      }
      // The tool result IS the knowledge: verbatim passages as plain,
      // citeable lines (title — url), mirroring the recall tool's format —
      // a JSON envelope would read as fetched-page data, not as YOUR known
      // knowledge with sources to cite.
      const lines = hits.map((hit) => {
        const title = hit.title ? `"${hit.title}"` : 'Untitled';
        const fetched = hit.fetchedAt ? `, fetched ${hit.fetchedAt.slice(0, 10)}` : '';
        const position =
          hit.sourceType === 'result'
            ? 'search snippet — NOT full text (fetch the page for more)'
            : `chunk ${hit.chunkIndex + 1} of ${hit.chunkCount}`;
        return `- ${title} — ${hit.url} [${position}; relevance ${hit.score.toFixed(2)}${fetched}]\n  ${hit.content}`;
      });
      return `YOUR KNOWLEDGE BASE (encyclopedia) — verbatim passages from pages you fetched and documents the user uploaded in earlier sessions. Cite the url/title of what you use so the user can open the source (upload urls open/download the original file). Full-text chunks are fragments of their document — pass a result's exact url to the encyclopedia-read tool when you need the surrounding or full document:\n${lines.join('\n')}`;
    },
  });
}
