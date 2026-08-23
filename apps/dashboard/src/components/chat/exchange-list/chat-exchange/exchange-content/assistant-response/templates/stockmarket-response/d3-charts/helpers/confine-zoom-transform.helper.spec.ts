import { scaleLinear } from 'd3-scale';
import type { ZoomTransform } from 'd3-zoom';
import { describe, expect, it } from 'vitest';

import { buildZoomTransform } from './build-zoom-transform.helper';
import { confineZoomTransform } from './confine-zoom-transform.helper';

const plot = { left: 6, top: 0, right: 406, bottom: 200 };

function setup(dataLength: number, rangeFrom: number) {
  const xBase = scaleLinear()
    .domain([0, dataLength])
    .range([plot.left, plot.right]);
  return {
    xBase,
    confine: (t: ZoomTransform) =>
      confineZoomTransform(t, plot, xBase, dataLength, rangeFrom),
    windowOf: (t: ZoomTransform) => t.rescaleX(xBase).domain(),
  };
}

describe('confineZoomTransform', () => {
  it('returns the transform unchanged when the window is inside the territory', () => {
    const { xBase, confine } = setup(100, 0);
    const t = buildZoomTransform(plot.left, plot.right, xBase, {
      from: 40,
      to: 70,
    });

    expect(confine(t)).toBe(t);
  });

  it('clamps a window dragged past the latest data', () => {
    const { xBase, confine, windowOf } = setup(100, 0);
    const t = buildZoomTransform(plot.left, plot.right, xBase, {
      from: 90,
      to: 120,
    });

    const confined = confine(t);
    const [from, to] = windowOf(confined);
    expect(from).toBeCloseTo(70, 5);
    expect(to).toBeCloseTo(100, 5);
  });

  it('clamps a window dragged before the range start', () => {
    const { xBase, confine, windowOf } = setup(100, 78);
    const t = buildZoomTransform(plot.left, plot.right, xBase, {
      from: 60,
      to: 82,
    });

    const confined = confine(t);
    const [from, to] = windowOf(confined);
    expect(from).toBeCloseTo(78, 5);
    expect(to).toBeCloseTo(100, 5);
  });

  it('limits a zoom-out to the range span', () => {
    const { xBase, confine, windowOf } = setup(100, 78);
    const t = buildZoomTransform(plot.left, plot.right, xBase, {
      from: 10,
      to: 100,
    });

    const confined = confine(t);
    const [from, to] = windowOf(confined);
    expect(to - from).toBeLessThanOrEqual(22 + 1e-6);
    expect(from).toBeGreaterThanOrEqual(78 - 1e-6);
  });

  it('preserves the vertical pan position', () => {
    const { xBase, confine } = setup(100, 78);
    const t = buildZoomTransform(plot.left, plot.right, xBase, {
      from: 200,
      to: 222,
    });
    const shifted = t.translate(0, 40);

    const confined = confine(shifted);
    expect(confined.y).toBe(shifted.y);
  });
});
