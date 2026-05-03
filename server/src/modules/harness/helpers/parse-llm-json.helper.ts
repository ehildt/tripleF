import JSON5 from 'json5';

/**
 * Parse JSON emitted by an LLM, tolerating common deviations from the
 * strict JSON spec that models frequently produce:
 * - markdown code fences (```json ... ```)
 * - single-quoted strings
 * - unquoted object keys
 * - trailing commas
 */
export function parseLlmJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new SyntaxError('Response is empty.');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON5.parse(cleaned);
  }
}
