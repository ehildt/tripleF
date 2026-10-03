import type { ToolSummaryFn } from './tool-summary.types.js';

/** Summary for point-lookup tool results: whether a title or id came back. */
export const summarizeFound: ToolSummaryFn = (data) => ({
  found: !!data.title || !!data.id,
});
