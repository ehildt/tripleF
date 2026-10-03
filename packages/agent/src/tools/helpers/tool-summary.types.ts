/**
 * Signature of a tool-result summarizer: maps a raw tool result payload to a
 * compact summary record (counts, sources, booleans) for harness tracing.
 */
export type ToolSummaryFn = (data: Record<string, unknown>) => Record<string, unknown>;
