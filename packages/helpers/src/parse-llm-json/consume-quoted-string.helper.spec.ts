import { consumeQuotedString } from './consume-quoted-string.helper.ts';

describe('consumeQuotedString', () => {
  it('consumes a simple quoted string', () => {
    const out: string[] = [];
    const next = consumeQuotedString('"hello" rest', 0, out);
    expect(out.join('')).toBe('"hello"');
    expect(next).toBe(7);
  });

  it('preserves existing escape sequences', () => {
    const out: string[] = [];
    const next = consumeQuotedString('"a\\nb" rest', 0, out);
    expect(out.join('')).toBe('"a\\nb"');
    expect(next).toBe(6);
  });

  it('escapes literal control characters', () => {
    const out: string[] = [];
    const next = consumeQuotedString('"a\nb" rest', 0, out);
    expect(out.join('')).toBe('"a\\nb"');
    expect(next).toBe(5);
  });

  it('handles unterminated strings', () => {
    const out: string[] = [];
    const next = consumeQuotedString('"unterminated', 0, out);
    expect(next).toBe(13);
  });
});
