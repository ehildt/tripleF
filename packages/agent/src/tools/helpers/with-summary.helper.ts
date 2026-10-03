import type { Tool } from 'ai';

import { defaultSummarize } from './default-summarize.helper.js';
import type { ToolSummaryFn } from './tool-summary.types.js';
import type { ToolWithSummary } from './with-summary.types.js';

/**
 * Attach a result summarizer to a tool — the summarizer given, else the
 * default shape-detecting one — so harness traces stay compact.
 */
export function withSummary(tool: Tool, summarize: ToolSummaryFn = defaultSummarize): ToolWithSummary {
  const t = tool as ToolWithSummary;
  t.summarize = summarize;
  return t;
}
