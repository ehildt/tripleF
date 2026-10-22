export function buildHeaders(model: string): Record<string, string> {
  return {
    'x-harness-llm': model,
    accept: 'application/json',
  };
}
