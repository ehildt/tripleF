/**
 * Combine the labels of same-value lines into one readable badge. When all
 * labels share a trailing word (e.g. "1W LOW" and "52W LOW"), the unique
 * prefixes join with " / " and the suffix stays once → "1W / 52W LOW".
 * Otherwise the full labels join ("Pivot / 52W LOW").
 */
export function combineLabels(labels: string[]): string {
  const unique = [...new Set(labels)];
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  const tails = unique.map((label) => {
    const lastSpace = label.lastIndexOf(' ');
    return lastSpace > 0
      ? {
          prefix: label.slice(0, lastSpace),
          suffix: label.slice(lastSpace + 1),
        }
      : { prefix: '', suffix: label };
  });
  const sharedSuffix = tails.every((tail) => tail.suffix === tails[0].suffix)
    ? tails[0].suffix
    : null;
  if (!sharedSuffix || tails.some((tail) => !tail.prefix)) {
    return unique.join(' / ');
  }
  return `${tails.map((tail) => tail.prefix).join(' / ')} ${sharedSuffix}`;
}
