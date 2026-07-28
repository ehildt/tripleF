import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/append-labeled-fields.helper';
import { buildSourcesLines } from '../../../composables/helpers/build-sources-lines.helper';

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

  appendLabeledFields(parts, [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ]);

  if (data.summary?.trim()) parts.push(data.summary.trim());
  const sectionTitle = data.sectionTitle?.trim();
  if (sectionTitle) parts.push(`Section: ${sectionTitle}`);
  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  appendList(parts, 'Key findings:', data.keyFindings);

  const quote = data.quote?.trim();
  if (quote) parts.push(`Quote: ${quote}`);
  const conclusion = data.conclusion?.trim();
  if (conclusion) parts.push(`Conclusion: ${conclusion}`);

  appendCards(parts, data.cards);
  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}

/** One plain-text line per article card: label, with the URL in parens. */
function appendCards(
  parts: string[],
  cards: HarnessResponseData['cards'],
): void {
  if (!cards?.length) return;
  parts.push('Article cards:');
  for (const card of cards) {
    const label = card.title?.trim() || card.linkLabel?.trim() || 'card';
    const urlPart = card.url ? ` (${card.url})` : '';
    parts.push(`- ${label}${urlPart}`);
  }
}
