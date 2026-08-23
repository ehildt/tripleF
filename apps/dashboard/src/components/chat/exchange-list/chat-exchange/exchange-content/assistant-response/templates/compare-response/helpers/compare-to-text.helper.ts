import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { buildSourcesLines } from '../../../composables/helpers/sources/build-sources-lines.helper';

/**
 * Convert a compare response into plain text for the model history.
 * The gallery is omitted — it renders the user's own uploaded images, which
 * the user turn already references.
 */
export function compareToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ];
  appendLabeledFields(parts, fields);

  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  const note = data.note?.trim();
  if (note) parts.push(`Note: ${note}`);

  appendList(parts, 'Key differences:', data.keyFindings);

  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}
