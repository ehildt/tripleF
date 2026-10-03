/** A chart point carrying a timestamp and a single value. */
type TimeValuePoint = {
  time: string;
  value: number;
};

/** Rebase a point to 100 at the series base for the stacked-area chart. */
export function mapPointToNormalizedValue(p: TimeValuePoint, base: number) {
  return {
    time: p.time,
    value: base !== 0 ? (p.value / base) * 100 : 0,
  };
}
