import { describe, expect, it } from 'vitest';

import { calcActiveIndexFromScroll } from './calc-active-index-from-scroll.helper';

const items = [
  { offsetLeft: 0, offsetWidth: 100 },
  { offsetLeft: 100, offsetWidth: 100 },
  { offsetLeft: 200, offsetWidth: 100 },
];

describe('calcActiveIndexFromScroll', () => {
  it('returns 0 for an empty item list', () => {
    expect(calcActiveIndexFromScroll(0, 100, [])).toBe(0);
  });

  it('picks the item centered in the viewport', () => {
    // Viewport centered on item 1: 100 (scrollLeft) + 50 (half width) = 150.
    expect(calcActiveIndexFromScroll(100, 100, items)).toBe(1);
  });

  it('picks the first item when it is centered', () => {
    expect(calcActiveIndexFromScroll(0, 100, items)).toBe(0);
  });

  it('picks the last item when it is centered', () => {
    expect(calcActiveIndexFromScroll(200, 100, items)).toBe(2);
  });

  it('breaks ties toward the earlier item', () => {
    // Track center sits exactly between items 1 and 2 at 200.
    expect(calcActiveIndexFromScroll(150, 100, items)).toBe(1);
  });

  it('handles items of differing widths', () => {
    const mixed = [
      { offsetLeft: 0, offsetWidth: 200 },
      { offsetLeft: 200, offsetWidth: 50 },
      { offsetLeft: 250, offsetWidth: 150 },
    ];
    // Viewport center at 225: item 1 center 225, item 2 center 325.
    expect(calcActiveIndexFromScroll(200, 50, mixed)).toBe(1);
  });
});
