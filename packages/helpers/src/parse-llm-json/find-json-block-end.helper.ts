import { skipQuotedString } from './skip-quoted-string.helper.ts';

/**
 * Find the balanced closing position for the first top-level JSON object or
 * array in `text`, respecting string literals and escape sequences.
 * Returns the index just past the closing brace/bracket, or -1 if not found.
 */
export function findJsonBlockEnd(text: string): number {
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
