/** Project a point to its raw value for the stacked-area chart. */
export function mapPointToRawValue(p: { time: string; value: number }) {
  return { time: p.time, value: p.value };
}
