import JSON5 from 'json5';

/**
 * Process a single character inside a JSON string literal.
 * Returns the escaped form if it is a control character, otherwise char itself.
 */
function processStringChar(ch: string, code: number): string {
  switch (ch) {
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    default:
      if (code < 0x20) {
        return `\\u${code.toString(16).padStart(4, '0')}`;
      }
      return ch;
  }
}

/**
 * Consume one double-quoted string from `text` starting at position `start`,
 * handling existing escape sequences and escaping raw control characters.
 *
 * Appends to `out` and returns the new cursor position past the closing quote.
 */
function consumeQuotedString(
  text: string,
  start: number,
  out: string[],
): number {
  let i = start + 1; // skip opening quote
  out.push('"');

  while (i < text.length) {
    if (text[i] === '"') {
      out.push('"');
      return i + 1;
    }

    const isEscaped = text[i] === '\\' && i + 1 < text.length;
    if (isEscaped) {
      out.push('\\');
      out.push(text[++i]);
      i++;
    } else {
      out.push(processStringChar(text[i], text.charCodeAt(i)));
      i++;
    }
  }

  return i; // unterminated string — end of input reached
}

/**
 * Scan through a JSON-ish string and escape literal control characters that
 * appear inside double-quoted regions. Structural characters ({ } [ ] , : )
 * pass untouched.
 */
function escapeLiteralControlsInStrings(text: string): string {
  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] !== '"') {
      // outside quoted region — pass through verbatim
      out.push(text[i]);
      i++;
    } else {
      i = consumeQuotedString(text, i, out);
    }
  }

  return out.join('');
}

/**
 * Skip a double-quoted string starting at `start` in `text`, respecting
 * escape sequences. Returns the index just past the closing quote, or the
 * end-of-input index if the string is unterminated.
 */
function skipQuotedString(text: string, start: number): number {
  let i = start + 1; // skip opening quote
  while (i < text.length) {
    const strCh = text[i];
    if (strCh === '\\' && i + 1 < text.length) {
      i += 2;
    } else if (strCh === '"') {
      return i + 1;
    } else {
      i++;
    }
  }
  return i;
}

/**
 * Find the balanced closing position for the first top-level JSON object or
 * array in `text`, respecting string literals and escape sequences.
 * Returns the index just past the closing brace/bracket, or -1 if not found.
 */
function findJsonBlockEnd(text: string): number {
  let i = 0;

  while (i < text.length && text[i] !== '{' && text[i] !== '[') {
    i++;
  }
  if (i >= text.length) return -1;

  const opener = text[i];
  const closer = opener === '{' ? '}' : ']';
  let depth = 1;
  i++;

  while (i < text.length && depth > 0) {
    const ch = text[i];

    if (ch === '"') {
      i = skipQuotedString(text, i);
      continue;
    }

    if (ch === opener) depth++;
    else if (ch === closer) depth--;

    if (depth === 0) return i + 1;
    i++;
  }

  return -1;
}

function isIdentifierChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_$]/.test(ch);
}

/** Copy a quoted string (single or double) from `start` into `out` verbatim. */
function passQuotedString(text: string, start: number, out: string[]): number {
  const quote = text[start];
  out.push(quote);
  let i = start + 1;

  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      out.push(text[i], text[i + 1]);
      i += 2;
      continue;
    }
    out.push(text[i]);
    i++;
    if (text[i - 1] === quote) break;
  }

  return i;
}

/**
 * Replace bare `undefined` literals with `null` outside of quoted strings.
 * Models frequently emit JavaScript-style `"key": undefined`, which is
 * neither valid JSON nor valid JSON5 and would otherwise abort the parse.
 * `null` is safe here: downstream zod schemas preprocess null into their
 * documented defaults (e.g. media counts become 0).
 */
function replaceUndefinedLiterals(text: string): string {
  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '"' || text[i] === "'") {
      i = passQuotedString(text, i, out);
      continue;
    }

    if (
      text.startsWith('undefined', i) &&
      !isIdentifierChar(text[i - 1]) &&
      !isIdentifierChar(text[i + 'undefined'.length])
    ) {
      out.push('null');
      i += 'undefined'.length;
      continue;
    }

    out.push(text[i]);
    i++;
  }

  return out.join('');
}

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
  const sanitized = replaceUndefinedLiterals(
    escapeLiteralControlsInStrings(cleaned),
  );

  try {
    return JSON.parse(sanitized);
  } catch {
    return JSON5.parse(sanitized);
  }
}
