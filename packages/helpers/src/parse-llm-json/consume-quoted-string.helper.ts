import { processStringChar } from './process-string-char.helper.ts';

/**
 * Consume one double-quoted string from `text` starting at position `start`,
 * handling existing escape sequences and escaping raw control characters.
 *
 * Appends to `out` and returns the new cursor position past the closing quote.
 */
export function consumeQuotedString(text: string, start: number, out: string[]): number {
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
