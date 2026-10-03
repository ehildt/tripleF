import { summarizeContent } from './summarize-content.helper.js';
import { summarizeResults } from './summarize-results.helper.js';
import type { ToolSummaryFn } from './tool-summary.types.js';

/**
 * Fallback summarizer used when a tool declares no summary of its own:
 * picks the results-shaped summary for list payloads, the content-shaped
 * summary for text payloads, and reports nothing otherwise.
 */
export const defaultSummarize: ToolSummaryFn = (data) => {
  if (Array.isArray(data.results)) return summarizeResults(data);
  if (typeof data.content === 'string') return summarizeContent(data);
  return {};
};
