import type { HarnessResponseData } from '@/types/harness-response-data.model';

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
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  const extracted = data.sectionContent?.trim();
  if (extracted) parts.push(`Extracted text:\n${extracted}`);

  if (data.keyFindings?.length) {
    parts.push('Observations:');
    for (const item of data.keyFindings) {
      const text = item.text?.trim();
      if (text) parts.push(`- ${text}`);
    }
  }

  return parts.join('\n\n');
}
