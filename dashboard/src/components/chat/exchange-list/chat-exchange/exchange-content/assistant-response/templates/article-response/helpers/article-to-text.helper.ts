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
 * Convert an article response into plain text for the model history.
 * Editorial metadata (author, dates, read time) and media galleries are
 * omitted — follow-ups need the written content and sources, not the chrome.
 */
export function articleToText(data: HarnessResponseData): string {
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

  if (data.summary?.trim()) parts.push(data.summary.trim());
  const sectionTitle = data.sectionTitle?.trim();
  if (sectionTitle) parts.push(`Section: ${sectionTitle}`);
  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  appendList(parts, 'Key findings:', data.keyFindings);

  const quote = data.quote?.trim();
  if (quote) parts.push(`Quote: ${quote}`);
  const conclusion = data.conclusion?.trim();
  if (conclusion) parts.push(`Conclusion: ${conclusion}`);

  if (data.sources?.length) {
    parts.push('Sources:');
    for (const source of data.sources) parts.push(buildSourceLine(source));
  }

  if (data.cards?.length) {
    parts.push('Article cards:');
    for (const card of data.cards) {
      const label = card.title?.trim() || card.linkLabel?.trim() || 'card';
      const urlPart = card.url ? ` (${card.url})` : '';
      parts.push(`- ${label}${urlPart}`);
    }
  }

  return parts.join('\n\n');
}
