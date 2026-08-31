import type {
  IngestedReplacement,
  SanitizeToolResultOptions,
} from '../sanitize-tool-result.helper.types.js';

type ToolResultEntry = { toolName: string; result: unknown };

/** Dispatch one tool result to its per-tool sanitizer. */
export function sanitizeToolResultWithIngested(
  tr: ToolResultEntry,
  options: {
    ingestedByUrl: Map<string, IngestedReplacement>;
    brokenImageUrls?: Set<string>;
    brokenPageUrls?: Set<string>;
  },
  sanitizeImageSearchResult: (
    result: unknown,
    options?: SanitizeToolResultOptions,
  ) => unknown,
  sanitizeWebSearchResult: (
    result: unknown,
    options?: SanitizeToolResultOptions,
  ) => unknown,
): ToolResultEntry {
  if (tr.toolName.endsWith('ImageSearch')) {
    return {
      toolName: tr.toolName,
      result: sanitizeImageSearchResult(tr.result, options),
    };
  }
  if (tr.toolName.endsWith('WebSearch') || tr.toolName.endsWith('NewsSearch')) {
    return {
      toolName: tr.toolName,
      result: sanitizeWebSearchResult(tr.result, options),
    };
  }
  return tr;
}
