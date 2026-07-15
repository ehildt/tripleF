import type { ExtractedShopOffer } from './extract-shop-offers.helper.js';

function priceNumeric(price?: string): number {
  if (!price) return Infinity;
  // Installment/subscription prices (e.g. "$29.12/mo") are not comparable
  // to one-time prices — sort them last instead of letting them win.
  if (price.includes('/')) return Infinity;
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : Infinity;
}

/**
 * Product shop-offers guard: when the respond model dropped or omitted the
 * shopOffers field even though shopping results were available in the tool
 * context, inject the extracted offers verbatim (price-sorted, installments
 * last). Returns the data unchanged when offers are already present or no
 * extracted offers exist.
 */
export function ensureProductShopOffers(
  data: Record<string, unknown> | undefined,
  template: string | undefined,
  extractedOffers: ExtractedShopOffer[],
): Record<string, unknown> | undefined {
  if (template !== 'product' || !data || extractedOffers.length === 0)
    return data;

  const existing = data.shopOffers;
  if (Array.isArray(existing) && existing.length > 0) return data;

  const sorted = [...extractedOffers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );

  return { ...data, shopOffers: sorted };
}
