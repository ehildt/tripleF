import { describe, expect, it } from 'vitest';

import { resolveMarkerSymbolPath } from './resolve-marker-symbol-path.helper';

describe('resolveMarkerSymbolPath', () => {
  it('returns a path for each marker symbol', () => {
    for (const name of ['arrowUp', 'arrowDown', 'circle', 'square'] as const) {
      expect(resolveMarkerSymbolPath(name).length).toBeGreaterThan(0);
    }
  });

  it('falls back to the triangle path for unknown symbols', () => {
    expect(resolveMarkerSymbolPath('arrowUp')).toBe(
      resolveMarkerSymbolPath('arrowDown'),
    );
  });
});
