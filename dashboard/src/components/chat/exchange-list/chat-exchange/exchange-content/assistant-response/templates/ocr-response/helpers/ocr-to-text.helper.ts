import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';

/**
 * Convert an ocr response into plain text for the model history.
 * The extracted text is labeled so the model can tell it apart from
 * observations about it. The gallery is omitted — it renders the user's own
 * uploaded images, which the user turn already references.
 */
export function ocrToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ];
  appendLabeledFields(parts, fields);

  const extracted = data.sectionContent?.trim();
  if (extracted) parts.push(`Extracted text:\n${extracted}`);

  appendList(parts, 'Observations:', data.keyFindings);

  return parts.join('\n\n');
}
