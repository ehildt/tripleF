import type { CollapsedSections } from '@/types/assistant-response-data.model';

import { DEFAULT_COLLAPSED_SECTIONS } from '../assistant-response-settings.constant';

/** Parse response-section collapse flags over their defaults. */
export function parseCollapsedSections(raw: string | null): CollapsedSections {
  const collapsed = { ...DEFAULT_COLLAPSED_SECTIONS };
  if (!raw) return collapsed;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return collapsed;
    }
    const saved = parsed as Record<string, unknown>;
    if (typeof saved.sources === 'boolean') collapsed.sources = saved.sources;
    if (typeof saved.keyFindings === 'boolean') {
      collapsed.keyFindings = saved.keyFindings;
    }
    if (typeof saved.internationalCoverage === 'boolean') {
      collapsed.internationalCoverage = saved.internationalCoverage;
    }
    return collapsed;
  } catch {
    return collapsed;
  }
}
