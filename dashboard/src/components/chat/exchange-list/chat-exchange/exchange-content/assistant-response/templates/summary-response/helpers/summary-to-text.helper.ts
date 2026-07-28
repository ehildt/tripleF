import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { buildSourceLine } from '../../../composables/helpers/build-source-line.helper';

/**
 * Convert a summary response into plain text for the model history.
 * Media galleries are omitted — follow-ups need the recap itself and its
 * sources, not the illustration URLs.
 */
export function summaryToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ];
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.summary?.trim()) parts.push(data.summary.trim());

  if (data.keyFindings?.length) {
    parts.push('Key points:');
    for (const item of data.keyFindings) {
      const text = item.text?.trim();
      if (text) parts.push(`- ${text}`);
    }
  }

  if (data.sources?.length) {
    parts.push('Sources:');
    for (const source of data.sources) parts.push(buildSourceLine(source));
  }

  return parts.join('\n\n');
}
