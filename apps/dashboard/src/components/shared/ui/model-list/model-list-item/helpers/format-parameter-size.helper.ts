/**
 * Format a model parameter size for the model selector's meta line.
 *
 * Local Ollama tags already return compact labels ("8.0B", "7B") which pass
 * through unchanged. Ollama Cloud backfills the raw parameter count as a
 * digit string ("116829156672") from the /show payload — those are compacted
 * to billions ("117B") or millions ("355M").
 */
export function formatParameterSize(parameterSize: string): string {
  if (!/^\d+$/.test(parameterSize)) return parameterSize;
  const count = Number(parameterSize);
  if (count >= 1e9) return `${Math.round(count / 1e9)}B`;
  if (count >= 1e6) return `${Math.round(count / 1e6)}M`;
  return parameterSize;
}
