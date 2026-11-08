import { appendLabeledFields } from '@/components/chat/shared/helpers/assistant-response/sources/append-labeled-fields.helper';
import { appendList } from '@/components/chat/shared/helpers/assistant-response/sources/append-list.helper';
import { buildArticleCardsLines } from '@/components/chat/shared/helpers/assistant-response/sources/build-article-cards-lines.helper';
import { buildSourcesLines } from '@/components/chat/shared/helpers/assistant-response/sources/build-sources-lines.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/**
 * Convert an article response into plain text for the model history.
 * Editorial metadata (author, dates, read time) and media galleries are
 * omitted — follow-ups need the written content and sources, not the chrome.
 */
export function articleToText(data: AssistantResponseData): string {
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

  parts.push(...buildArticleCardsLines(data.cards));
  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}
