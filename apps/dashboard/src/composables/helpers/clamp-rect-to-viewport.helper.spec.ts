import { describe, expect, it } from 'vitest';

import { clampRectToViewport } from './clamp-rect-to-viewport.helper';

describe('clampRectToViewport', () => {
  it('keeps an already-visible rect unchanged', () => {
    const rect = { x: 100, y: 100, width: 200, height: 150 };
    expect(clampRectToViewport(rect)).toEqual(rect);
  });

  it('clamps negative coordinates to the viewport edge', () => {
    const clamped = clampRectToViewport({
      x: -50,
      y: -20,
      width: 100,
      height: 100,
    });
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
  });

  it('clamps an overflowing rect inside the viewport with a margin', () => {
    const clamped = clampRectToViewport({
      x: window.innerWidth,
      y: window.innerHeight,
      width: 100,
      height: 100,
    });
    expect(clamped.x).toBe(window.innerWidth - 100 - 16);
    expect(clamped.y).toBe(window.innerHeight - 100 - 16);
  });

  it('preserves the rect size', () => {
    const clamped = clampRectToViewport({
      x: -10,
      y: -10,
      width: 42,
      height: 24,
    });
    expect(clamped.width).toBe(42);
    expect(clamped.height).toBe(24);
  });
});
