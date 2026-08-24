import JSON5 from 'json5';

import { escapeLiteralControlsInStrings } from './escape-literal-controls-in-strings.helper.ts';
import { findJsonBlockEnd } from './find-json-block-end.helper.ts';
import { replaceUndefinedLiterals } from './replace-undefined-literals.helper.ts';

/**
 * Parse JSON emitted by an LLM, tolerating common deviations from the
 * strict JSON spec that models frequently produce:
 * - markdown code fences (```json ... ```)
 * - single-quoted strings
 * - unquoted object keys
 * - trailing commas
 * - literal newlines / control characters inside quoted string values
 * - bare `undefined` literals (coerced to null)
 */
export function parseLlmJson(text: string): unknown {
  let cleaned = text
    .trim()
    // Drop thinking-model reasoning: a full  thinking… response block, or a
    // dangling preamble that ends in  response before the actual output. Left
    // in place it would poison JSON block extraction.
    .replace(/ thinking[\s\S]*?<\/think>/g, '')
    .replace(/^[\s\S]*?<\/think>/, '')
    // Drop [Template: <name>] markers the model echoes before the JSON —
    // their leading "[" would otherwise be mistaken for the JSON start.
    .replace(/\[Template:\s*[^\]]+\]/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) {
    throw new SyntaxError('Response is empty.');
  }

  // Extract the first top-level JSON object or array; discard any leading or
  // trailing explanation text that models sometimes append.
  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  let jsonStart = -1;
  if (firstObject >= 0 && firstArray >= 0) {
    jsonStart = Math.min(firstObject, firstArray);
  } else if (firstObject >= 0) {
    jsonStart = firstObject;
  } else if (firstArray >= 0) {
    jsonStart = firstArray;
  }

  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  const jsonEnd = findJsonBlockEnd(cleaned);
  if (jsonEnd > 0 && jsonEnd < cleaned.length) {
    cleaned = cleaned.slice(0, jsonEnd);
  }

  // Pre-sanitize literal control characters inside quoted strings and
  // coerce JavaScript `undefined` literals to null.
  const sanitized = replaceUndefinedLiterals(escapeLiteralControlsInStrings(cleaned));

  try {
    return JSON.parse(sanitized);
  } catch {
    return JSON5.parse(sanitized);
  }
}
