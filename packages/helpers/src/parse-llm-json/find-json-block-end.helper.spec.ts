import { findJsonBlockEnd } from './find-json-block-end.helper.ts';

describe('findJsonBlockEnd', () => {
  it('finds the end of a simple object', () => {
    expect(findJsonBlockEnd('{"a": 1}')).toBe(8);
  });

  it('finds the end of a simple array', () => {
    expect(findJsonBlockEnd('[1, 2, 3]')).toBe(9);
  });

  it('handles nested structures', () => {
    expect(findJsonBlockEnd('{"a": {"b": [1, 2]}}')).toBe(20);
  });

  it('ignores braces inside strings', () => {
    expect(findJsonBlockEnd('{"a": "}"}')).toBe(10);
  });

  it('returns -1 when no block is found', () => {
    expect(findJsonBlockEnd('no json here')).toBe(-1);
  });
});
