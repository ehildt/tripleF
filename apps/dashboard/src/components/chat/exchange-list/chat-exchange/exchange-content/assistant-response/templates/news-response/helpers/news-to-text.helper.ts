import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { buildRelatedStoriesLines } from '../../../composables/helpers/sources/build-related-stories-lines.helper';
import { buildSourcesLines } from '../../../composables/helpers/sources/build-sources-lines.helper';

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
  appendLabeledFields(parts, fields);

  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());

  appendList(parts, 'Key findings:', data.keyFindings);

  parts.push(
    ...buildSourcesLines(data.sources),
    ...buildRelatedStoriesLines(data.relatedStories),
  );

  return parts.join('\n\n');
}
