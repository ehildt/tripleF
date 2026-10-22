import { appendLabeledFields } from '@/stores/helpers/assistant-response/sources/append-labeled-fields.helper';
import { appendList } from '@/stores/helpers/assistant-response/sources/append-list.helper';
import { buildSourcesLines } from '@/stores/helpers/assistant-response/sources/build-sources-lines.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/**
 * Convert a describe response into plain text for the model history.
 * The gallery is omitted — it renders the user's own uploaded images, which
 * the user turn already references.
 */
export function describeToText(data: AssistantResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ];
  appendLabeledFields(parts, fields);

  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  appendList(parts, 'Key observations:', data.keyFindings);

  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}
