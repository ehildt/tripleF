import type { HarnessResponseData } from '@/types/harness-response-data.model';

/**
 * Build the "Article cards:" section as plain-text lines: the heading
 * followed by one label line per card, with the URL in parens. Returns no
 * lines when there are no cards, so callers can spread the result
 * unconditionally.
 */
export function buildArticleCardsLines(
  cards: HarnessResponseData['cards'],
): string[] {
  if (!cards?.length) return [];
  const lines = cards.map((card) => {
    const label = card.title?.trim() || card.linkLabel?.trim() || 'card';
    const urlPart = card.url ? ` (${card.url})` : '';
    return `- ${label}${urlPart}`;
  });
  return ['Article cards:', ...lines];
}
