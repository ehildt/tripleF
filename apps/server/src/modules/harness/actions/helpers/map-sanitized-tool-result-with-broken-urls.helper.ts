import type { ToolResult } from '@triplef/ai-sdk';

import { sanitizeToolResult } from '../../helpers/sanitize/sanitize-tool-result.helper.js';

/** Sanitize one tool result with broken-url sets applied. */
export function mapSanitizedToolResultWithBrokenUrls(
  tr: ToolResult,
  brokenImageUrls: Set<string>,
  brokenPageUrls: Set<string>,
): ToolResult {
  return {
    toolName: tr.toolName,
    result: sanitizeToolResult(tr.toolName, tr.result, {
      brokenImageUrls,
      brokenPageUrls,
    }),
  };
}
