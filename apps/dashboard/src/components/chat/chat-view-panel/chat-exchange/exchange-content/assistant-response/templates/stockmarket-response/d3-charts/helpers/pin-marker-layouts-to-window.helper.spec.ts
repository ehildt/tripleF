import { describe, expect, it } from 'vitest';

import type { MarkerLayout } from './build-marker-layout.helper';
import { pinMarkerLayoutsToWindow } from './pin-marker-layouts-to-window.helper';

function layout(overrides: Partial<MarkerLayout> = {}): MarkerLayout {
  return {
    index: 10,
    price: 100,
    symbol: 'circle',
    color: 'rgba(0,0,0,1)',
    text: 'X',
    textAbove: false,
    ...overrides,
  } as MarkerLayout;
}

describe('pinMarkerLayoutsToWindow', () => {
  it('pins a window-anchored marker into the visible window', () => {
    const result = pinMarkerLayoutsToWindow(
      [layout({ index: 1, pinToWindow: true })],
      5,
      9,
    );
    expect(result[0].index).toBe(5);
  });

  it('clamps a pinned marker to the last visible index', () => {
    const result = pinMarkerLayoutsToWindow(
      [layout({ index: 50, pinToWindow: true })],
      5,
      9,
    );
    expect(result[0].index).toBe(8);
  });

  it('leaves unpinned markers untouched', () => {
    const marker = layout({ index: 3 });
    const result = pinMarkerLayoutsToWindow([marker], 5, 9);
    expect(result[0]).toBe(marker);
  });

  it('returns the layouts unchanged for an empty window', () => {
    const marker = layout({ pinToWindow: true });
    expect(pinMarkerLayoutsToWindow([marker], 5, 5)).toEqual([marker]);
  });
});
