import type { D3ReferenceLine } from '../D3Chart.types';
import { combineLabels } from './combine-labels.helper';

/**
 * Relative value epsilon below which two levels are the same price: smaller
 * than the model-dedupe epsilon (0.5 %) so genuinely close-but-distinct
 * levels survive, but float noise and model copy-paste (a "52W LOW"
 * re-emitting the generated range low) collapse.
 */
const SAME_VALUE_EPSILON = 1e-4;

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
