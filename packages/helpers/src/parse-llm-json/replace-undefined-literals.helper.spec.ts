import { replaceUndefinedLiterals } from './replace-undefined-literals.helper.ts';

describe('replaceUndefinedLiterals', () => {
  it('replaces bare undefined with null', () => {
    expect(replaceUndefinedLiterals('{"a": undefined}')).toBe('{"a": null}');
  });

  it('leaves undefined inside strings untouched', () => {
    expect(replaceUndefinedLiterals('{"a": "undefined"}')).toBe('{"a": "undefined"}');
  });

  it('leaves identifiers containing undefined untouched', () => {
    expect(replaceUndefinedLiterals('{"a": undefinedValue}')).toBe('{"a": undefinedValue}');
  });
});
