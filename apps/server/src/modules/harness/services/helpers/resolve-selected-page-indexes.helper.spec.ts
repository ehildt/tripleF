import { describe, expect, it } from 'vitest';

import { resolveSelectedPageIndexes } from './resolve-selected-page-indexes.helper.js';

describe('resolveSelectedPageIndexes', () => {
  it('returns the referenced pages in manifest order', () => {
    expect(
      resolveSelectedPageIndexes(['p1', 'p2', 'p3'], new Set(['p3', 'p1'])),
    ).toEqual([0, 2]);
  });

  it('falls back to every page when none are referenced (bootstrap/legacy clients)', () => {
    expect(
      resolveSelectedPageIndexes(['p1', 'p2'], new Set(['unrelated'])),
    ).toEqual([0, 1]);
  });

  it('treats an empty reference set as bootstrap (no selection possible)', () => {
    expect(resolveSelectedPageIndexes(['p1'], new Set())).toEqual([0]);
  });

  it('returns empty for a manifest without pages', () => {
    expect(resolveSelectedPageIndexes([], new Set(['p1']))).toEqual([]);
  });
});
