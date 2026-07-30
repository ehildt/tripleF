/**
 * Normalize Ollama's snake_case token statistics onto their camelCase
 * counterparts. The raw stream event is mutated in place so downstream
 * consumers (messages store, debug log) see the canonical field names.
 */
export function normalizeRawData(raw: Record<string, unknown>): void {
  if (
    raw.prompt_eval_count !== undefined &&
    raw.promptEvalCount === undefined
  ) {
    raw.promptEvalCount = raw.prompt_eval_count;
  }
  if (raw.eval_count !== undefined && raw.evalCount === undefined) {
    raw.evalCount = raw.eval_count;
  }
  if (raw.eval_duration !== undefined && raw.evalDuration === undefined) {
    raw.evalDuration = raw.eval_duration;
  }
  if (raw.total_duration !== undefined && raw.totalDuration === undefined) {
    raw.totalDuration = raw.total_duration;
  }
}
