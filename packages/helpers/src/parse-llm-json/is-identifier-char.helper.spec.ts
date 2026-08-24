import { isIdentifierChar } from './is-identifier-char.helper.ts';

describe('isIdentifierChar', () => {
  it('accepts letters, digits, underscore, and dollar', () => {
    expect(isIdentifierChar('a')).toBe(true);
    expect(isIdentifierChar('Z')).toBe(true);
    expect(isIdentifierChar('0')).toBe(true);
    expect(isIdentifierChar('_')).toBe(true);
    expect(isIdentifierChar('$')).toBe(true);
  });

  it('rejects non-identifier characters', () => {
    expect(isIdentifierChar(' ')).toBe(false);
    expect(isIdentifierChar('-')).toBe(false);
    expect(isIdentifierChar('.')).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isIdentifierChar(undefined)).toBe(false);
  });
});
