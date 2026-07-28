import type { RelatedStory, Source } from '@/types/harness-response-data.model';

import { buildSourceLine } from './build-source-line.helper';

/**
 * Build the "Sources:" section as plain-text lines: the heading followed by
 * one formatted line per source. Returns no lines when there are no sources,
 * so callers can spread the result unconditionally.
 */
export function buildSourcesLines(
  sources?: Array<Source | RelatedStory>,
): string[] {
  if (!sources?.length) return [];
  return ['Sources:', ...sources.map(buildSourceLine)];
}
