import type { HarnessResponseData } from '@/types/harness-response-data.model';

/**
 * Convert an imagelist response into plain text for the model history.
 *
 * CONTRACT: the "Previously shown images" marker and the "- label (url)"
 * line format are parsed server-side by collectHistoryImageUrls as the
 * legacy fallback for image dedupe (the persisted shown-media registry is
 * authoritative for new conversations). Do not rename the marker or change
 * the parenthesized URL format.
 */
export function imagelistToText(data: HarnessResponseData): string {
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

  if (data.galleryItems?.length) {
    parts.push('Previously shown images:');
    for (const item of data.galleryItems) {
      if (!item.imageUrl) continue;
      const label = item.title?.trim() || item.imageAlt?.trim() || 'image';
      parts.push(`- ${label} (${item.imageUrl})`);
    }
  }

  return parts.join('\n\n');
}
