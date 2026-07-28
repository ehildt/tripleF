import type { HarnessResponseData } from '@/types/harness-response-data.model';

/**
 * Convert an imagelist response into plain text for the model history.
 * The previously shown image URLs are listed explicitly so follow-up
 * requests can reference or skip images the user already saw.
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
