import { skipQuotedString } from './skip-quoted-string.helper.ts';

describe('skipQuotedString', () => {
  it('skips a simple quoted string', () => {
    expect(skipQuotedString('"hello" rest', 0)).toBe(7);
  });

  it('skips escaped quotes', () => {
    expect(skipQuotedString('"a\\"b" rest', 0)).toBe(6);
  });

  it('handles unterminated strings', () => {
    expect(skipQuotedString('"unterminated', 0)).toBe(13);
  });
});
