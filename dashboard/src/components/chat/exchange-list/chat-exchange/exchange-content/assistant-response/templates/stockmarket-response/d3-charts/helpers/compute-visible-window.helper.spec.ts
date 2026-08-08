import { describe, expect, it } from 'vitest';

import { computeVisibleWindow } from './compute-visible-window.helper';

describe('computeVisibleWindow', () => {
  it('fits the full series when activeBars is null', () => {
    expect(computeVisibleWindow(100, null)).toEqual({ from: 0, to: 100 });
  });

  it('shows the trailing slice when activeBars is a count', () => {
    expect(computeVisibleWindow(100, 66)).toEqual({ from: 34, to: 100 });
  });

  it('clamps to the series start when the count exceeds the data', () => {
    expect(computeVisibleWindow(30, 66)).toEqual({ from: 0, to: 30 });
  });

  it('handles an empty series', () => {
    expect(computeVisibleWindow(0, null)).toEqual({ from: 0, to: 0 });
    expect(computeVisibleWindow(0, 66)).toEqual({ from: 0, to: 0 });
  });
});
