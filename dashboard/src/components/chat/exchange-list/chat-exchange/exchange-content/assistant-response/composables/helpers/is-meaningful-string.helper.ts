export function isMeaningfulString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  return !['undefined', 'null', 'none', 'n/a', 'na', 'not applicable'].includes(
    lower,
  );
}
