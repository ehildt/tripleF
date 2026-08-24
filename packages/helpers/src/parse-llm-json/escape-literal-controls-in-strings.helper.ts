import { consumeQuotedString } from './consume-quoted-string.helper.ts';

/**
 * Scan through a JSON-ish string and escape literal control characters that
 * appear inside double-quoted regions. Structural characters ({ } [ ] , : )
 * pass untouched.
 */
export function escapeLiteralControlsInStrings(text: string): string {
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
