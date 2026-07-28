import type { HarnessResponseData } from '@/types/harness-response-data.model';

/**
 * Convert a videolist response into plain text for the model history.
 *
 * CONTRACT: the "Previously shown videos (skip these videoUrls):" marker and
 * the "- label (url)" line format are parsed server-side by
 * collectHistoryVideoUrls to dedupe videolist follow-ups. Do not rename the
 * marker or change the parenthesized URL format.
 */
export function videolistToText(data: HarnessResponseData): string {
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

  if (data.videoGalleryItems?.length) {
    parts.push('Previously shown videos (skip these videoUrls):');
    for (const item of data.videoGalleryItems) {
      if (!item.videoUrl) continue;
      const label = item.title?.trim() || 'video';
      parts.push(`- ${label} (${item.videoUrl})`);
    }
  }

  return parts.join('\n\n');
}
