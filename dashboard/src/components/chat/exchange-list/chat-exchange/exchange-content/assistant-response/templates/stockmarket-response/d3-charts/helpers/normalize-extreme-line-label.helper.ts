/**
 * Whether a label describes a series extreme ("52w high", "52W LOW", "ATH",
 * "All-Time High") rather than a support/resistance level. The 52-week
 * marker follows the chart's canonical "52W" spelling.
 */
const EXTREME_LABEL_PATTERN = /\b(52W|ATH|ATL|HIGH|LOW)\b|all[- ]?time/i;

/**
 * Normalize a model-emitted reference-line label that describes a series
 * extreme to the chart's canonical "{range} HIGH"/"{range} LOW" format
 * ("52w high" → "52W HIGH", "All-Time Low" → "All LOW"). Non-extreme labels
 * pass through unchanged.
 */
export function normalizeExtremeLineLabel(
  label: string | undefined,
): string | undefined {
  if (!label) return label;
  const text = label.trim();
  if (!EXTREME_LABEL_PATTERN.test(text)) return label;
  const is52Week = /\b52W\b/i.test(text);
  const isHigh = /\b(high|ATH)\b/i.test(text);
  const isLow = /\b(low|ATL)\b/i.test(text);
  const prefix = is52Week ? '52W' : 'All';
  if (isHigh) return `${prefix} HIGH`;
  if (isLow) return `${prefix} LOW`;
  if (is52Week) return '52W';
  return label;
}
