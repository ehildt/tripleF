import { isIdentifierChar } from './is-identifier-char.helper.ts';
import { passQuotedString } from './pass-quoted-string.helper.ts';

/**
 * Replace bare `undefined` literals with `null` outside of quoted strings.
 * Models frequently emit JavaScript-style `"key": undefined`, which is
 * neither valid JSON nor valid JSON5 and would otherwise abort the parse.
 * `null` is safe here: downstream zod schemas preprocess null into their
 * documented defaults (e.g. media counts become 0).
 */
export function replaceUndefinedLiterals(text: string): string {
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
