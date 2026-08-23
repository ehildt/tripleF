import type { ToolResult } from '../../../ai-sdk/types/ai-sdk-params.types.js';

/** Extract the first ticker code from an eodhdSearch result, if present. */
export function extractEodhdTickerFromResults(
  toolResults: ToolResult[],
): string | undefined {
  for (const tr of toolResults) {
    if (tr.toolName !== 'eodhdSearch') continue;
    const results = (tr.result as { results?: Array<{ code?: string }> })
      ?.results;
    return results?.find((r) => r.code)?.code;
  }
  return undefined;
}
