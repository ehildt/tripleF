import { describe, expect, it } from 'vitest';

import {
  computeTooltipPosition,
  CURSOR_GAP,
} from './compute-tooltip-position.helper';

describe('computeTooltipPosition', () => {
  it('places the panel after the cursor by the cursor gap', () => {
    const { x } = computeTooltipPosition({ x: 100, y: 100 }, 140, 92, 600, 300);
    expect(x).toBe(100 + CURSOR_GAP);
  });

  it('flips the panel before the cursor when it would overflow the right edge', () => {
    const { x } = computeTooltipPosition({ x: 500, y: 100 }, 140, 92, 600, 300);
    expect(x).toBe(500 - CURSOR_GAP - 140);
  });

  it('centers vertically on the cursor', () => {
    const { y } = computeTooltipPosition({ x: 100, y: 100 }, 140, 92, 600, 300);
    expect(y).toBe(100 - 92 / 2);
  });

  it('clamps vertically inside the container', () => {
    const top = computeTooltipPosition({ x: 100, y: 0 }, 140, 92, 600, 300);
    expect(top.y).toBe(CURSOR_GAP);
    const bottom = computeTooltipPosition(
      { x: 100, y: 300 },
      140,
      92,
      600,
      300,
    );
    expect(bottom.y).toBe(300 - 92 - CURSOR_GAP);
  });
});
