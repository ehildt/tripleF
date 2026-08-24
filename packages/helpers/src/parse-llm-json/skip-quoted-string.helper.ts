/**
 * Skip a double-quoted string starting at `start` in `text`, respecting
 * escape sequences. Returns the index just past the closing quote, or the
 * end-of-input index if the string is unterminated.
 */
export function skipQuotedString(text: string, start: number): number {
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
