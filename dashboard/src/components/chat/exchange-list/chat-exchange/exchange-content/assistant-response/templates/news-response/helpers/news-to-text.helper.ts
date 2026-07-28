import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { buildSourceLine } from '../../../composables/helpers/build-source-line.helper';

function appendList(
  parts: string[],
  title: string,
  items?: Array<{ text?: string }>,
): void {
  if (!items?.length) return;
  parts.push(title);
  for (const item of items) {
    const text = item.text?.trim();
    if (text) parts.push(`- ${text}`);
  }
}

/**
 * Convert a news response into plain text for the model history.
 * Editorial metadata (dateline, byline, read time) and media galleries are
 * omitted — follow-ups need the story content, sources, and related stories.
 */
export function newsToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Headline', data.headline],
    ['Deck', data.deck],
    ['Lead', data.lead],
  ];
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  appendList(parts, 'Key points:', data.keyPoints);

  if (data.sources?.length) {
    parts.push('Sources:');
    for (const source of data.sources) parts.push(buildSourceLine(source));
  }

  if (data.relatedStories?.length) {
    parts.push('Related stories:');
    for (const story of data.relatedStories) {
      parts.push(buildSourceLine(story));
    }
  }

  return parts.join('\n\n');
}
