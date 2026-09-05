/**
 * Trigram Dice coefficient between two labels: 2·|A∩B| / (|A|+|B|) over
 * character-trigram multisets (space-padded). Cheap, deterministic,
 * language-agnostic — the fuzzy snap signal for taxonomy labels
 * (`games`/`gaming` ≈ 0.8, `auth-service`/`auth-services` ≈ 0.97).
 * Short labels (<3 chars) degrade to exact comparison.
 */
export function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;
  const gramsA = trigrams(a);
  const gramsB = trigrams(b);
  let overlap = 0;
  const rest = new Map<string, number>();
  for (const gram of gramsB) rest.set(gram, (rest.get(gram) ?? 0) + 1);
  for (const gram of gramsA) {
    const count = rest.get(gram) ?? 0;
    if (count > 0) {
      overlap++;
      rest.set(gram, count - 1);
    }
  }
  return (2 * overlap) / (gramsA.length + gramsB.length);
}

/** True when the two labels share at least one alphanumeric token. */
export function sharesTokenOverlap(a: string, b: string): boolean {
  const tokensA = new Set(tokenize(a));
  return tokenize(b).some((token) => tokensA.has(token));
}

/** Character-trigrams of the space-padded lowercase label. */
function trigrams(label: string): string[] {
  const padded = ` ${label.toLowerCase()} `;
  const grams: string[] = [];
  for (let i = 0; i < padded.length - 2; i++) {
    grams.push(padded.slice(i, i + 3));
  }
  return grams;
}

/** Alphanumeric word tokens of a label. */
function tokenize(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}
