import type { ToolSummaryFn } from './tool-summary.types.js';

/** Summary for content-shaped tool results: the extracted text length. */
export const summarizeContent: ToolSummaryFn = (data) => ({
  contentLength: typeof data.content === 'string' ? data.content.length : 0,
});
