import { scaleLinear } from 'd3-scale';
import { describe, expect, it } from 'vitest';

import { buildZoomTransform } from './build-zoom-transform.helper';

function buildXBase(plotLeft: number, plotRight: number, dataLength: number) {
  return scaleLinear().domain([0, dataLength]).range([plotLeft, plotRight]);
}

describe('buildZoomTransform', () => {
  it('maps the window onto the plot via rescaleX', () => {
    const plotLeft = 6;
    const plotRight = 406;
    const dataLength = 100;
    const xBase = buildXBase(plotLeft, plotRight, dataLength);

    const transform = buildZoomTransform(plotLeft, plotRight, xBase, {
      from: 90,
      to: 100,
    });
    const domain = transform.rescaleX(xBase).domain();

    expect(domain[0]).toBeCloseTo(90, 5);
    expect(domain[1]).toBeCloseTo(100, 5);
  });

  it('scales the full series to the plot at k=1', () => {
    const plotLeft = 6;
    const plotRight = 406;
    const dataLength = 100;
    const xBase = buildXBase(plotLeft, plotRight, dataLength);

    const transform = buildZoomTransform(plotLeft, plotRight, xBase, {
      from: 0,
      to: 100,
    });

    expect(transform.k).toBeCloseTo(1, 5);
    expect(transform.x).toBeCloseTo(0, 5);
  });

  it('handles a window that is the full plot when data is shorter', () => {
    const plotLeft = 6;
    const plotRight = 406;
    const dataLength = 30;
    const xBase = buildXBase(plotLeft, plotRight, dataLength);

    const transform = buildZoomTransform(plotLeft, plotRight, xBase, {
      from: 0,
      to: 30,
    });
    const domain = transform.rescaleX(xBase).domain();

    expect(transform.k).toBeCloseTo(1, 5);
    expect(domain[0]).toBeCloseTo(0, 5);
    expect(domain[1]).toBeCloseTo(30, 5);
  });
});
