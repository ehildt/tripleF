import { describe, expect, it } from 'vitest';

import type { MarkerLayout } from './build-marker-layout.helper';
import { mergeMarkerLayouts } from './merge-marker-layouts.helper';

function layout(index: number, textAbove = true, text = 'x'): MarkerLayout {
  return {
    index,
    price: 100 + index,
    symbol: 'arrowDown',
    color: 'red',
    text,
    textAbove,
  };
}

describe('mergeMarkerLayouts', () => {
  it('keeps the pivot layer when there are no explicit markers', () => {
    expect(mergeMarkerLayouts([], [layout(1), layout(2)])).toHaveLength(2);
  });

  it('merges explicit markers into the pivot layer', () => {
    const merged = mergeMarkerLayouts(
      [layout(10, true, 'ATH')],
      [layout(1), layout(2)],
    );
    expect(merged).toHaveLength(3);
    expect(merged[0].text).toBe('ATH');
  });

  it('the explicit marker wins on the same bar and side', () => {
    const merged = mergeMarkerLayouts(
      [layout(5, true, 'ATH')],
      [layout(5, true, 'Sell')],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe('ATH');
  });

  it('keeps a pivot on the same bar when it sits on the other side', () => {
    const merged = mergeMarkerLayouts(
      [layout(5, true, 'ATH')],
      [layout(5, false, 'Buy')],
    );
    expect(merged).toHaveLength(2);
  });
});
