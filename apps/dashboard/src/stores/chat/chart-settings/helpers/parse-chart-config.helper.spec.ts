import { describe, expect, it } from 'vitest';

import { DEFAULT_CHART_CONFIG } from '../chart-settings.constant';
import { parseChartConfig } from './parse-chart-config.helper';

describe('parseChartConfig', () => {
  it('applies documented values over a fresh copy of the defaults', () => {
    const parsed = parseChartConfig(
      '{"priceStyle":"line","volumeStyle":"histogram","heatmapVariant":"cells","colormap":"purple","showMarkers":false,"showReferenceLines":false,"showTooltip":false}',
    );

    expect(parsed).toEqual({
      priceStyle: 'line',
      volumeStyle: 'histogram',
      heatmapVariant: 'cells',
      colormap: 'purple',
      showMarkers: false,
      showReferenceLines: false,
      showTooltip: false,
    });
    expect(parsed).not.toBe(DEFAULT_CHART_CONFIG);
  });

  it('uses defaults for invalid fields, corrupt JSON, and non-records', () => {
    expect(
      parseChartConfig('{"priceStyle":"bars","showMarkers":"no"}'),
    ).toEqual(DEFAULT_CHART_CONFIG);
    expect(parseChartConfig('{')).toEqual(DEFAULT_CHART_CONFIG);
    expect(parseChartConfig('[]')).toEqual(DEFAULT_CHART_CONFIG);
    expect(parseChartConfig(null)).toEqual(DEFAULT_CHART_CONFIG);
  });
});
