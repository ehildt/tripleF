import type { DiscardedReference } from '@/types/harness-response-data.model';

/** Flattened, render-ready view of a discarded reference. */
export interface DiscardEntry {
  /** Thumbnail src for image entries. */
  thumbUrl?: string;
  /** Link target for link entries. */
  href?: string;
  label: string;
  reason: string;
}

/**
 * Flatten a discarded reference into its renderable fields: image entries
 * render as a thumbnail, link entries as a link row. Entries without a URL
 * are unrenderable and return undefined. `reason` may be empty — the model
 * authors it for explicit discards; harness-complement entries (candidates
 * the model neither used nor discarded) carry none and the template falls
 * back to a localized label.
 */
export function toDiscardEntry(
  reference: DiscardedReference,
): DiscardEntry | undefined {
  if (!reference || typeof reference !== 'object') return undefined;

  const reason = typeof reference.reason === 'string' ? reference.reason : '';

  if (reference.type === 'image') {
    if (!reference.imageUrl) return undefined;
    return {
      thumbUrl: encodeURI(reference.imageUrl),
      label: reference.title || reference.imageUrl,
      reason,
    };
  }

  if (reference.type === 'link') {
    if (!reference.url) return undefined;
    return {
      href: reference.url,
      label: reference.title || reference.url,
      reason,
    };
  }

  return undefined;
}
