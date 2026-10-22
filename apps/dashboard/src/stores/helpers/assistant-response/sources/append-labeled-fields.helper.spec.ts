import { describe, expect, it } from 'vitest';

import { appendLabeledFields } from './append-labeled-fields.helper';

describe('appendLabeledFields', () => {
  it('pushes a "Label: value" line for non-empty values', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [['Title', 'My title']]);
    expect(parts).toEqual(['Title: My title']);
  });

  it('trims the value before appending', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [['Title', '  spaced  ']]);
    expect(parts).toEqual(['Title: spaced']);
  });

  it('skips empty, whitespace, and undefined values', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [
      ['A', undefined],
      ['B', ''],
      ['C', '   '],
      ['D', 'kept'],
    ]);
    expect(parts).toEqual(['D: kept']);
  });
});
