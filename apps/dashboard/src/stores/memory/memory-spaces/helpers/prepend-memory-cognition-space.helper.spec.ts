import { describe, expect, it } from 'vitest';

import { prependMemoryCognitionSpace } from './prepend-memory-cognition-space.helper';

describe('prependMemoryCognitionSpace', () => {
  it('trims and prepends a new id', () => {
    expect(prependMemoryCognitionSpace(['default'], '  alice  ')).toEqual([
      'alice',
      'default',
    ]);
  });

  it('moves an existing id to the front without duplicating it', () => {
    expect(
      prependMemoryCognitionSpace(['work', 'alice', 'default'], 'alice'),
    ).toEqual(['alice', 'work', 'default']);
  });

  it('returns the original array for an empty id', () => {
    const spaces = ['default'];
    expect(prependMemoryCognitionSpace(spaces, '  ')).toBe(spaces);
  });

  it('caps the updated history at 20 entries', () => {
    const spaces = Array.from({ length: 20 }, (_, index) => `space-${index}`);
    const updated = prependMemoryCognitionSpace(spaces, 'new-space');
    expect(updated).toHaveLength(20);
    expect(updated[0]).toBe('new-space');
    expect(updated.at(-1)).toBe('space-18');
    expect(spaces).toHaveLength(20);
  });
});
