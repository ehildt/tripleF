import { describe, expect, it } from 'vitest';

import { appendList } from './append-list.helper';

describe('appendList', () => {
  it('does nothing when the list is missing or empty', () => {
    const parts: string[] = [];
    appendList(parts, 'Key findings:', undefined);
    appendList(parts, 'Key findings:', []);
    expect(parts).toEqual([]);
  });

  it('pushes the title then one bullet per non-empty entry', () => {
    const parts: string[] = [];
    appendList(parts, 'Key findings:', [
      { text: 'first' },
      { text: '  second  ' },
      { text: '   ' },
    ]);
    expect(parts).toEqual(['Key findings:', '- first', '- second']);
  });
});
