import { describe, expect, it } from 'vitest';

import { stackMarkerLayouts } from './stack-marker-layouts.helper';

describe('stackMarkerLayouts', () => {
  const base = {
    index: 0,
    price: 10,
    symbol: 'arrowUp',
    color: 'c',
    text: null,
  };

  it('stacks multiple above-bar markers on the same bar', () => {
    const out = stackMarkerLayouts([
      { ...base, textAbove: true },
      { ...base, textAbove: true },
    ]);
    expect(out.map((m) => m.stackOffset)).toEqual([0, -10]);
  });

  it('stacks below-bar markers downward', () => {
    const out = stackMarkerLayouts([
      { ...base, textAbove: false },
      { ...base, textAbove: false },
    ]);
    expect(out.map((m) => m.stackOffset)).toEqual([0, 10]);
  });

  it('keeps a single marker at offset 0', () => {
    const out = stackMarkerLayouts([{ ...base, textAbove: true }]);
    expect(out[0].stackOffset).toBe(0);
  });
});
