/** Rebase a point to 100 at the series base for the stacked-area chart. */
export function mapPointToNormalizedValue(
  p: { time: string; value: number },
  base: number,
) {
  return {
    time: p.time,
    value: base !== 0 ? (p.value / base) * 100 : 0,
  };
}
