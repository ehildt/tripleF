/** A marker label split into its price and word parts. */
export interface SplitMarkerText {
  price: string | null;
  word: string | null;
}

/** Whether a token looks like a price (digits, dots, commas). */
function isPriceToken(token: string): boolean {
  return /^[\d.,]+$/.test(token);
}

/**
 * Split a marker label into a price line and a word line so the chart can
 * stack them in a column beside the arrow. Handles the pivot format
 * ("216.94 Sell"), the model's "word @ price" format ("Buy @ 83"), and
 * word-only labels ("D" for a dividend).
 */
export function splitMarkerText(
  text: string | null | undefined,
): SplitMarkerText {
  if (!text) return { price: null, word: null };
  const trimmed = text.trim();
  // "216.94 Sell" — price first, then the word.
  const firstSpace = trimmed.search(/\s/);
  if (firstSpace > 0) {
    const first = trimmed.slice(0, firstSpace);
    if (isPriceToken(first)) {
      return { price: first, word: trimmed.slice(firstSpace).trim() };
    }
  }
  // "Sell @ 216.94" — word @ price (legacy format).
  const atIndex = trimmed.lastIndexOf(' @ ');
  if (atIndex > 0) {
    const price = trimmed.slice(atIndex + 3).trim();
    if (isPriceToken(price)) {
      return { price, word: trimmed.slice(0, atIndex).trim() };
    }
  }
  return { price: null, word: trimmed };
}
