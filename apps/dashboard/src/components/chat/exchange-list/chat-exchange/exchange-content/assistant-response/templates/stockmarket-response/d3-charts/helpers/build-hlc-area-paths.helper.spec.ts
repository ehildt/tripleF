import { describe, expect, it } from 'vitest';

import { buildHlcAreaPaths } from './build-hlc-area-paths.helper';

describe('buildHlcAreaPaths', () => {
  it('returns empty paths without points', () => {
    expect(buildHlcAreaPaths([])).toEqual({
      topArea: '',
      bottomArea: '',
      highLine: '',
      lowLine: '',
      closeLine: '',
    });
  });

  it('builds the high/low/close lines from the points', () => {
    const paths = buildHlcAreaPaths([
      { x: 10, high: 40, low: 20, close: 30 },
      { x: 20, high: 50, low: 25, close: 35 },
    ]);
    expect(paths.highLine).toBe('M 10 40 L 20 50');
    expect(paths.lowLine).toBe('M 10 20 L 20 25');
    // Close line is reversed (last bar first) so areas can reuse it.
    expect(paths.closeLine).toBe('M 20 35 L 10 30');
  });

  it('closes the top area over the high line and reversed close', () => {
    const paths = buildHlcAreaPaths([
      { x: 10, high: 40, low: 20, close: 30 },
      { x: 20, high: 50, low: 25, close: 35 },
    ]);
    expect(paths.topArea).toBe(
      'M 10 40 L 20 50 L 20 35 M 20 35 L 10 30 L 10 40 Z',
    );
  });

  it('closes the bottom area over the low line and reversed close', () => {
    const paths = buildHlcAreaPaths([
      { x: 10, high: 40, low: 20, close: 30 },
      { x: 20, high: 50, low: 25, close: 35 },
    ]);
    expect(paths.bottomArea).toBe(
      'M 10 20 L 20 25 L 20 35 M 20 35 L 10 30 L 10 20 Z',
    );
  });
});
