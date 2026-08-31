import type { ToolResult } from '@triplef/ai-sdk';

import { sanitizeToolResult } from '../../helpers/sanitize/sanitize-tool-result.helper.js';

/** Sanitize one tool result through the per-tool dispatcher. */
export function mapSanitizedToolResult(tr: ToolResult): ToolResult {
  return {
    toolName: tr.toolName,
    result: sanitizeToolResult(tr.toolName, tr.result),
  };
}
