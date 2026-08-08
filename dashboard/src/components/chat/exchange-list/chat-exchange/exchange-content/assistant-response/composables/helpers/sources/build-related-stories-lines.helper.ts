import type { RelatedStory } from '@/types/harness-response-data.model';

import { buildSourceLine } from './build-source-line.helper';

/**
 * Build the "Related stories:" section as plain-text lines: the heading
 * followed by one formatted line per story. Returns no lines when there are
 * no stories, so callers can spread the result unconditionally.
 */
export function buildRelatedStoriesLines(stories?: RelatedStory[]): string[] {
  if (!stories?.length) return [];
  return ['Related stories:', ...stories.map(buildSourceLine)];
}
