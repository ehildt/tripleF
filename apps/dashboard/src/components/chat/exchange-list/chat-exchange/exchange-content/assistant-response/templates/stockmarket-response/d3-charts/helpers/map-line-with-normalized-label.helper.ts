import type { D3ReferenceLine } from '../D3Chart.types';
import { normalizeExtremeLineLabel } from './normalize-extreme-line-label.helper';

/** Normalize a reference line's label to the canonical format. */
export function mapLineWithNormalizedLabel(
  line: D3ReferenceLine,
): D3ReferenceLine {
  return { ...line, label: normalizeExtremeLineLabel(line.label) };
}
