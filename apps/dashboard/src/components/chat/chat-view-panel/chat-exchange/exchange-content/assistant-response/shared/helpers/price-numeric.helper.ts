/**
 * Numeric sort key for a formatted shop-offer price string. Installment or
 * subscription prices (e.g. "$29.12/mo") are not comparable to one-time
 * prices — they sort last instead of winning the ascending comparison.
 */
export function priceNumeric(price?: string): number {
  if (!price) return Infinity;
  if (price.includes('/')) return Infinity;
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : Infinity;
}
