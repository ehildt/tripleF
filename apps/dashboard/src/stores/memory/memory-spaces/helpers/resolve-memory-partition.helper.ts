/** Resolve current/legacy partition storage without performing migration I/O. */
export function resolveMemoryPartition(
  current: string | null,
  legacy: string | null,
): string {
  if (current !== null) return current.trim();
  return legacy?.trim() || 'default';
}
