import { describe, expect, it } from 'vitest';

import { mergeDefined } from './merge-defined.helper.js';

type Patch = { width?: number; maxHeight?: number | null; label?: string };

describe('mergeDefined', () => {
  it('merges defined patch fields over the base', () => {
    expect(
      mergeDefined<Patch>({ width: 100, label: 'base' }, { width: 200 }),
    ).toEqual({
      width: 200,
      label: 'base',
    });
  });

  it('skips undefined patch fields instead of clobbering the base', () => {
    expect(
      mergeDefined<Patch>({ width: 100, maxHeight: 50 }, { width: undefined }),
    ).toEqual({
      width: 100,
      maxHeight: 50,
    });
  });

  it('keeps null because it is a meaningful reset', () => {
    expect(mergeDefined<Patch>({ maxHeight: 50 }, { maxHeight: null })).toEqual(
      {
        maxHeight: null,
      },
    );
  });

  it('returns an empty object when both sides are undefined', () => {
    expect(mergeDefined<Patch>(undefined, undefined)).toEqual({});
  });

  it('returns a copy of the base when the patch is undefined', () => {
    const base: Patch = { width: 10 };
    const merged = mergeDefined(base, undefined);

    expect(merged).toEqual({ width: 10 });
    expect(merged).not.toBe(base);
  });

  it('does not mutate the base object', () => {
    const base: Patch = { width: 10 };

    mergeDefined(base, { width: 20 });

    expect(base.width).toBe(10);
  });
});
