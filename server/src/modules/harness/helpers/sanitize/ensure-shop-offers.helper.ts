import type { ExtractedShopOffer } from '../media/extract-shop-offers.types.js';

/** Templates whose responses render a shopOffers list. */
const SHOP_OFFER_TEMPLATES = new Set(['product', 'shoplist']);

function priceNumeric(price?: string): number {
  if (!price) return Infinity;
  // Installment/subscription prices (e.g. "$29.12/mo") are not comparable
  // to one-time prices — sort them last instead of letting them win.
  if (price.includes('/')) return Infinity;
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : Infinity;
}

/**
 * Shop-offers guard: when the respond model dropped or omitted the shopOffers
 * field even though shopping results were available in the tool context,
 * inject the extracted offers verbatim (price-sorted, installments last).
 * Returns the data unchanged when offers are already present, the template
 * renders no offer list, or no extracted offers exist.
 */
export function ensureShopOffers(
  data: Record<string, unknown> | undefined,
  template: string | undefined,
  extractedOffers: ExtractedShopOffer[],
): Record<string, unknown> | undefined {
  if (!template || !SHOP_OFFER_TEMPLATES.has(template) || !data) return data;
  if (extractedOffers.length === 0) return data;

  const existing = data.shopOffers;
  if (Array.isArray(existing) && existing.length > 0) return data;

  const sorted = [...extractedOffers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );

  return { ...data, shopOffers: sorted };
}
