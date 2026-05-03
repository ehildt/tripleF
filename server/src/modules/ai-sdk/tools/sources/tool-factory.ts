import type { Tool } from 'ai';

export type ToolSummaryFn = (
  data: Record<string, unknown>,
) => Record<string, unknown>;

export type ToolWithSummary = Tool & { summarize?: ToolSummaryFn };

function extractSources(results: Array<Record<string, unknown>>): string[] {
  const sources = new Set<string>();
  for (const r of results) {
    const src = r.source as string | undefined;
    if (!src) continue;
    sources.add(src);
  }
  return [...sources];
}

export const summarizeResults: ToolSummaryFn = (data) => {
  const results = data.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(results)) return {};
  return {
    resultCount: results.length,
    sources: extractSources(results),
    sampleImageUrls: results
      .slice(0, 5)
      .map((r) => r.imageUrl)
      .filter(
        (url): url is string => typeof url === 'string' && url.length > 0,
      ),
  };
};

export const summarizeContent: ToolSummaryFn = (data) => ({
  contentLength: typeof data.content === 'string' ? data.content.length : 0,
});

export const summarizeFound: ToolSummaryFn = (data) => ({
  found: !!data.title || !!data.id,
});

export const defaultSummarize: ToolSummaryFn = (data) => {
  if (Array.isArray(data.results)) return summarizeResults(data);
  if (typeof data.content === 'string') return summarizeContent(data);
  return {};
};

export function withSummary(
  tool: Tool,
  summarize: ToolSummaryFn = defaultSummarize,
): ToolWithSummary {
  const t = tool as ToolWithSummary;
  t.summarize = summarize;
  return t;
}
