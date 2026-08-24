/** Copy a quoted string (single or double) from `start` into `out` verbatim. */
export function passQuotedString(text: string, start: number, out: string[]): number {
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
