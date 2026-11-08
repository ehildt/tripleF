import { describe, expect, it } from 'vitest';

import { parseMemoryCognitionSpaces } from './parse-memory-cognition-spaces.helper';

describe('parseMemoryCognitionSpaces', () => {
  it('uses the default for missing or non-array values', () => {
    expect(parseMemoryCognitionSpaces(null)).toEqual(['default']);
    expect(parseMemoryCognitionSpaces('')).toEqual(['default']);
    expect(parseMemoryCognitionSpaces('{}')).toEqual(['default']);
  });

  it('retains valid strings after trimming and filtering other entries', () => {
    expect(
      parseMemoryCognitionSpaces(
        JSON.stringify(['alice', 42, '  ', { id: 'x' }, 'work']),
      ),
    ).toEqual(['alice', 'work']);
  });

  it('caps the parsed history at 20 entries', () => {
    const spaces = Array.from({ length: 25 }, (_, index) => `space-${index}`);
    expect(parseMemoryCognitionSpaces(JSON.stringify(spaces))).toHaveLength(20);
  });

  it('uses the default when no valid entries remain', () => {
    expect(parseMemoryCognitionSpaces(JSON.stringify([null, ' ']))).toEqual([
      'default',
    ]);
  });

  it('leaves malformed JSON handling to the storage-owning caller', () => {
    expect(() => parseMemoryCognitionSpaces('{')).toThrow(SyntaxError);
  });
});
