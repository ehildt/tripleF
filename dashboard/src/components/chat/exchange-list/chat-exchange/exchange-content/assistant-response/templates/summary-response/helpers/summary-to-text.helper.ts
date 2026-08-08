import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { buildSourcesLines } from '../../../composables/helpers/sources/build-sources-lines.helper';

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
  appendLabeledFields(parts, fields);

  if (data.summary?.trim()) parts.push(data.summary.trim());

  appendList(parts, 'Key points:', data.keyFindings);

  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}
