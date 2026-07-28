import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { buildSourceLine } from '../../../composables/helpers/build-source-line.helper';

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
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  const note = data.note?.trim();
  if (note) parts.push(`Note: ${note}`);

  if (data.keyFindings?.length) {
    parts.push('Key differences:');
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
