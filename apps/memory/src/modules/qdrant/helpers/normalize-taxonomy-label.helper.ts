import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

import { normalizeCategory } from './normalize-category.helper.js';
import { normalizeCommunity } from './normalize-community.helper.js';
import { normalizeSubject } from './normalize-subject.helper.js';
import { normalizeTags } from './normalize-tags.helper.js';

/**
 * Normalize one label with its tier's boundary normalizer (the same rules
 * the write paths apply, so a user rename lands in the canonical form the
 * snap/alias machinery understands). Undefined for empty/oversized input.
 */
export function normalizeTaxonomyLabel(
  kind: MemoryTaxonomyKind,
  value: string,
): string | undefined {
  if (kind === 'cluster') return normalizeCategory(value);
  if (kind === 'community') return normalizeCommunity(value);
  if (kind === 'hub') return normalizeSubject(value);
  return normalizeTags([value])[0];
}
