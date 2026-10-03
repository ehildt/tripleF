/** A chart point carrying a timestamp and a single value. */
type TimeValuePoint = {
  time: string;
  value: number;
};

/** Project a point to its raw value for the stacked-area chart. */
export function mapPointToRawValue(p: TimeValuePoint) {
  return { time: p.time, value: p.value };
}
