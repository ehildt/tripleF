import { parsePartialJson } from './parse-partial-json.helper';
import { stripMarkdownFences } from './strip-markdown-fences.helper';

export function extractHarnessText(accumulatedDelta: string): string {
  const trimmed = accumulatedDelta.trim();
  if (!trimmed) return '';

  const parsed = parsePartialJson(stripMarkdownFences(trimmed));
  if (
    parsed != null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    typeof (parsed as Record<string, unknown>).text === 'string'
  ) {
    return (parsed as Record<string, string>).text;
  }

  return accumulatedDelta;
}
