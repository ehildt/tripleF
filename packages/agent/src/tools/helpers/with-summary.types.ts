import type { Tool } from 'ai';

import type { ToolSummaryFn } from './tool-summary.types.js';

/** A tool carrying an optional result summarizer for harness tracing. */
export type ToolWithSummary = Tool & { summarize?: ToolSummaryFn };
