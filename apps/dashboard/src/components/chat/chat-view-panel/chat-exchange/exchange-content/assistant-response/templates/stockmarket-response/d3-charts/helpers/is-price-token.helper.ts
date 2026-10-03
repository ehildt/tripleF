/** Whether a token looks like a price (digits, dots, commas). */
export function isPriceToken(token: string): boolean {
  return /^[\d.,]+$/.test(token);
}
