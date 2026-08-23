/**
 * Pixel span of a marker's text rows relative to its arrow anchor. Below-bar
 * markers render the price at +20 and the word at +36 (baseline, 10px font
 * plus stroke outline); above-bar markers mirror that above the arrow.
 */
const TEXT_SPAN_ABOVE = { top: -37, bottom: -12 };
const TEXT_SPAN_BELOW = { top: 12, bottom: 39 };

/** A nearby line counts as a hit when it passes within 2px of the text. */
const LINE_MARGIN = 2;
/** Per-step shift (px) applied while the text still collides with a line. */
const SHIFT_STEP = 6;
const MAX_STEPS = 6;

/**
 * Shift (px) that moves a marker's text rows clear of any unrelated
 * reference line: while a line other than the marker's own anchor line
 * (within 3px of the arrow — that co-location is intentional, the marker IS
 * the line's extreme) intersects the text block, step the text further out
 * — below-bar markers downward, above-bar upward. The arrow itself never
 * moves; only the two text rows shift by the returned amount.
 */
export function markerTextShift(
  arrowY: number,
  textAbove: boolean,
  lineYs: number[],
): number {
  const span = textAbove ? TEXT_SPAN_ABOVE : TEXT_SPAN_BELOW;
  const direction = textAbove ? -SHIFT_STEP : SHIFT_STEP;
  for (let step = 0; step <= MAX_STEPS; step++) {
    const shift = step * direction;
    const top = arrowY + shift + span.top;
    const bottom = arrowY + shift + span.bottom;
    const hit = lineYs.some(
      (lineY) =>
        Math.abs(lineY - arrowY) > 3 &&
        lineY >= top - LINE_MARGIN &&
        lineY <= bottom + LINE_MARGIN,
    );
    if (!hit) return shift;
  }
  return MAX_STEPS * direction;
}
