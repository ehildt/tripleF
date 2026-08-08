import { describe, expect, it } from 'vitest';

import { buildMarkerLayouts } from './build-marker-layout.helper';

const POINTS = [
  { time: '2026-01-01', high: 110, low: 90 },
  { time: '2026-01-02', high: 120, low: 100 },
  { time: '2026-01-03', high: 115, low: 95 },
];

describe('buildMarkerLayouts', () => {
  it('anchors aboveBar markers at the bar high with the label above', () => {
    const [layout] = buildMarkerLayouts(
      [
        {
          time: '2026-01-02',
          position: 'aboveBar',
          shape: 'arrowDown',
          color: '#f00',
          text: 'Sell',
        },
      ],
      POINTS,
    );
    expect(layout.index).toBe(1);
    expect(layout.price).toBe(120);
    expect(layout.textAbove).toBe(true);
    expect(layout.color).toBe('#f00');
    expect(layout.text).toBe('Sell');
  });

  it('anchors belowBar markers at the bar low with the label below', () => {
    const [layout] = buildMarkerLayouts(
      [{ time: '2026-01-01', position: 'belowBar', shape: 'arrowUp' }],
      POINTS,
    );
    expect(layout.index).toBe(0);
    expect(layout.price).toBe(90);
    expect(layout.textAbove).toBe(false);
    expect(layout.text).toBeNull();
  });

  it('drops markers whose time is missing from the history', () => {
    const layouts = buildMarkerLayouts(
      [{ time: '2026-01-99', position: 'aboveBar', shape: 'circle' }],
      POINTS,
    );
    expect(layouts).toEqual([]);
  });
});
