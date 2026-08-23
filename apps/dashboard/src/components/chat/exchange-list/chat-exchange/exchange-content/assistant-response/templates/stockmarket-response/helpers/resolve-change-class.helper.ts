export type ChangeClass = 'positive' | 'negative' | 'neutral';

/** Map a percent change to its semantic colour class. */
export function resolveChangeClass(changeP?: number): ChangeClass {
  const c = changeP ?? 0;
  if (c > 0) return 'positive';
  if (c < 0) return 'negative';
  return 'neutral';
}
