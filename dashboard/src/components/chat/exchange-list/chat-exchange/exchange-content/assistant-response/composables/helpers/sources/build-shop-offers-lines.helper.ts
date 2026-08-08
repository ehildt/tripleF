import type { ShopOffer } from '@/types/harness-response-data.model';

/** One plain-text line per offer: label — price — source, rating, (link). */
function buildShopOfferLine(offer: ShopOffer): string | undefined {
  const label = [offer.title, offer.price, offer.source]
    .filter(Boolean)
    .join(' — ');
  if (!label) return undefined;
  const rating =
    typeof offer.rating === 'number' ? ` — rating ${offer.rating}` : '';
  const linkPart = offer.link ? ` (${offer.link})` : '';
  return `- ${label}${rating}${linkPart}`;
}

/**
 * Build the "Shop offers:" section as plain-text lines: the heading followed
 * by one formatted line per offer. Returns no lines when there are no
 * renderable offers, so callers can spread the result unconditionally.
 */
export function buildShopOffersLines(offers?: ShopOffer[]): string[] {
  if (!offers?.length) return [];
  const lines = offers
    .map(buildShopOfferLine)
    .filter((line): line is string => !!line);
  if (lines.length === 0) return [];
  return ['Shop offers:', ...lines];
}
