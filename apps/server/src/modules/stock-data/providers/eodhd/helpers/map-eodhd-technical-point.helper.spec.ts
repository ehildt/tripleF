import { describe, expect, it } from 'vitest';

import { mapEodhdTechnicalPoint } from './map-eodhd-technical-point.helper.js';

describe('mapEodhdTechnicalPoint', () => {
  it('reads the value under the function-name key', () => {
    expect(
      mapEodhdTechnicalPoint({ date: '2025-01-01', rsi: 55 }, 'rsi'),
    ).toEqual({ date: '2025-01-01', value: 55 });
  });

  it('falls back to the lowercased key', () => {
    expect(
      mapEodhdTechnicalPoint({ date: '2025-01-01', rsi: 55 }, 'RSI'),
    ).toEqual({ date: '2025-01-01', value: 55 });
  });

  it('returns NaN when the value is missing', () => {
    expect(
      mapEodhdTechnicalPoint({ date: '2025-01-01' }, 'rsi').value,
    ).toBeNaN();
  });
});
