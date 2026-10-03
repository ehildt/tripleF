import type { ToolSummaryFn } from './tool-summary.types.js';

/** Collect the unique `source` values across a tool's result entries. */
function extractSources(results: Array<Record<string, unknown>>): string[] {
  const sources = new Set<string>();
  for (const r of results) {
    const src = r.source as string | undefined;
    if (!src) continue;
    sources.add(src);
  }
  return [...sources];
}

/**
 * Summary for list-shaped tool results: entry count, the unique providers
 * that contributed, and a small sample of image URLs for trace inspection.
 */
export const summarizeResults: ToolSummaryFn = (data) => {
  const results = data.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(results)) return {};
  return {
    resultCount: results.length,
    sources: extractSources(results),
    sampleImageUrls: results
      .slice(0, 5)
      .map((r) => r.imageUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0),
  };
};
