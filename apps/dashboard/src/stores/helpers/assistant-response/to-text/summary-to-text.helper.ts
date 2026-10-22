import { appendLabeledFields } from '@/stores/helpers/assistant-response/sources/append-labeled-fields.helper';
import { appendList } from '@/stores/helpers/assistant-response/sources/append-list.helper';
import { buildSourcesLines } from '@/stores/helpers/assistant-response/sources/build-sources-lines.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/**
 * Convert a summary response into plain text for the model history.
 * Media galleries are omitted — follow-ups need the recap itself and its
 * sources, not the illustration URLs.
 */
export function summaryToText(data: AssistantResponseData): string {
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
