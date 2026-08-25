import type { ToolResult } from '@triplef/ai-sdk';

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
