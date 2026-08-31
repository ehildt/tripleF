import type { KeyFinding } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../../media/is-trusted-image-url.helper';

/** Normalize one body section from a raw record. */
export function mapBodySection(
  item: Record<string, unknown>,
  toOptionalString: (value: unknown) => string | undefined,
  normalizeKeyFindings: (value: unknown) => KeyFinding[] | undefined,
) {
  const heroImageUrl = toOptionalString(item.heroImageUrl);
  return {
    topic: toOptionalString(item.topic),
    content: toOptionalString(item.content),
    strengths: normalizeKeyFindings(item.strengths),
    weaknesses: normalizeKeyFindings(item.weaknesses),
    recommendations: normalizeKeyFindings(item.recommendations),
    heroImageUrl:
      heroImageUrl && isTrustedImageUrl(heroImageUrl)
        ? heroImageUrl
        : undefined,
    heroImageAlt: toOptionalString(item.heroImageAlt),
    heroCaption: toOptionalString(item.heroCaption),
    heroVideoUrl: toOptionalString(item.heroVideoUrl),
    heroVideoTitle: toOptionalString(item.heroVideoTitle),
    heroVideoCaption: toOptionalString(item.heroVideoCaption),
  };
}
