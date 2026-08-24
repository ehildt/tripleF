import { passQuotedString } from './pass-quoted-string.helper.ts';

describe('passQuotedString', () => {
  it('copies a double-quoted string verbatim', () => {
    const out: string[] = [];
    const next = passQuotedString('"hello" rest', 0, out);
    expect(out.join('')).toBe('"hello"');
    expect(next).toBe(7);
  });

  it('copies a single-quoted string verbatim', () => {
    const out: string[] = [];
    const next = passQuotedString("'hello' rest", 0, out);
    expect(out.join('')).toBe("'hello'");
    expect(next).toBe(7);
  });

  it('preserves escape sequences', () => {
    const out: string[] = [];
    const next = passQuotedString('"a\\nb" rest', 0, out);
    expect(out.join('')).toBe('"a\\nb"');
    expect(next).toBe(6);
  });
});
