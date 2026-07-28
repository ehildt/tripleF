import type { RelatedStory, Source } from '@/types/harness-response-data.model';

/**
 * Format a source or related-story reference as a single history line.
 * The URL is parenthesized so URL-extracting consumers can find it.
 */
export function buildSourceLine(source: Source | RelatedStory): string {
  const label = [source.title, source.sourceName].filter(Boolean).join(' — ');
  const urlPart = source.url ? ` (${source.url})` : '';
  return `- ${label}${urlPart}`;
}
