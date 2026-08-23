import { describe, expect, it } from 'vitest';

import { appendLabeledFields } from './append-labeled-fields.helper';

describe('appendLabeledFields', () => {
  it('pushes "Label: value" for each non-empty value', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [
      ['Category', 'Research'],
      ['Title', 'Some title'],
    ]);
    expect(parts).toEqual(['Category: Research', 'Title: Some title']);
  });

  it('skips missing, empty, and whitespace-only values', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [
      ['Category', undefined],
      ['Title', ''],
      ['Subtitle', '   '],
    ]);
    expect(parts).toEqual([]);
  });

  it('trims values before pushing', () => {
    const parts: string[] = [];
    appendLabeledFields(parts, [['Title', '  Padded  ']]);
    expect(parts).toEqual(['Title: Padded']);
  });
});
