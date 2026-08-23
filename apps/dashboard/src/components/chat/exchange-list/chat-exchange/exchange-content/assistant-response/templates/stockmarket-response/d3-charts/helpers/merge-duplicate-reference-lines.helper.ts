import type { D3ReferenceLine } from '../D3Chart.types';

/**
 * Relative value epsilon below which two levels are the same price: smaller
 * than the model-dedupe epsilon (0.5 %) so genuinely close-but-distinct
 * levels survive, but float noise and model copy-paste (a "52W LOW"
 * re-emitting the generated range low) collapse.
 */
const SAME_VALUE_EPSILON = 1e-4;

/**
 * Combine the labels of same-value lines into one readable badge. When all
 * labels share a trailing word (e.g. "1W LOW" and "52W LOW"), the unique
 * prefixes join with " / " and the suffix stays once → "1W / 52W LOW".
 * Otherwise the full labels join ("Pivot / 52W LOW").
 */
function combineLabels(labels: string[]): string {
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

/**
 * Merge reference lines that sit at the same price level into one line with
 * a combined label, so an identical HIGH/LOW emitted per range ("1W LOW",
 * "52W LOW", both 164.27) renders as a single dashed line with a single
 * badge ("1W / 52W LOW") instead of stacked duplicates. The first line's
 * color wins; values and line positions are never altered.
 */
export function mergeDuplicateReferenceLines(
  lines: D3ReferenceLine[],
): D3ReferenceLine[] {
  const kept: Array<{ line: D3ReferenceLine; labels: string[] }> = [];
  for (const line of lines) {
    const group = kept.find(
      (entry) =>
        Math.abs(entry.line.value - line.value) /
          Math.max(Math.abs(line.value), 1) <
        SAME_VALUE_EPSILON,
    );
    if (!group) {
      kept.push({ line, labels: line.label ? [line.label] : [] });
      continue;
    }
    if (line.label) group.labels.push(line.label);
    const combined = combineLabels(group.labels);
    if (combined) group.line = { ...group.line, label: combined };
  }
  return kept.map((entry) => entry.line);
}
