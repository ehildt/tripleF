import { RESPONSE_LAYOUTS, type ResponseLayout } from '@triplef/agent/prompts';

/** Deterministic fallback: classic when allowed, else the first allowed. */
function defaultLayoutOf(allowed: ResponseLayout[]): ResponseLayout {
  if (allowed.includes('classic')) return 'classic';
  return allowed[0] ?? 'classic';
}

type LayoutPickedData = {
  layout?: unknown;
  quote?: unknown;
  heroImageUrl?: unknown;
  heroVideoUrl?: unknown;
  galleryItems?: unknown;
};

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Resolve the effective layout for a validated snippet-composed response:
 * the model's pick stands only when it is an allowed layout whose
 * precondition the content satisfies; otherwise coerce to the default.
 */
export function coerceLayout(
  data: LayoutPickedData,
  allowed: ResponseLayout[],
): ResponseLayout {
  const picked =
    typeof data.layout === 'string'
      ? (data.layout as ResponseLayout)
      : undefined;

  if (
    !picked ||
    !(RESPONSE_LAYOUTS as readonly string[]).includes(picked) ||
    !allowed.includes(picked)
  ) {
    return defaultLayoutOf(allowed);
  }

  if (picked === 'editorial' && !nonEmpty(data.quote)) {
    return defaultLayoutOf(allowed);
  }
  if (
    picked === 'split' &&
    !nonEmpty(data.heroImageUrl) &&
    !nonEmpty(data.heroVideoUrl)
  ) {
    return defaultLayoutOf(allowed);
  }
  if (
    picked === 'mosaic' &&
    (!Array.isArray(data.galleryItems) || data.galleryItems.length < 3)
  ) {
    return defaultLayoutOf(allowed);
  }
  return picked;
}
