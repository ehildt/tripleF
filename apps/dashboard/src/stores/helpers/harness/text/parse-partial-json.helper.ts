import { Allow, parse } from 'partial-json';

export function parsePartialJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to partial parser
  }

  try {
    return parse(trimmed, Allow.ALL);
  } catch {
    return null;
  }
}
