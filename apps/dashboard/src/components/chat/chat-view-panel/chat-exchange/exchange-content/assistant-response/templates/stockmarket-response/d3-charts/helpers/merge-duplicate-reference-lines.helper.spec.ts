import { describe, expect, it } from 'vitest';

import { mergeDuplicateReferenceLines } from './merge-duplicate-reference-lines.helper';

describe('mergeDuplicateReferenceLines', () => {
  it('keeps a single line unchanged', () => {
    const lines = [{ value: 164.27, label: '1W LOW', color: 'accent-primary' }];
    expect(mergeDuplicateReferenceLines(lines)).toEqual(lines);
  });

  it('merges same-value lines into one combined label', () => {
    expect(
      mergeDuplicateReferenceLines([
        { value: 164.27, label: '1W LOW', color: 'accent-primary' },
        { value: 164.27, label: '52W LOW', color: 'status-error' },
      ]),
    ).toEqual([
      { value: 164.27, label: '1W / 52W LOW', color: 'accent-primary' },
    ]);
  });

  it('keeps distinct values separate', () => {
    expect(
      mergeDuplicateReferenceLines([
        { value: 164.27, label: '1W LOW' },
        { value: 180, label: 'HIGH' },
      ]),
    ).toHaveLength(2);
  });
});
