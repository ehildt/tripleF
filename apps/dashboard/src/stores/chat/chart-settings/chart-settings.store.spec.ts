import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChartSettingsStore } from './chart-settings.store';

describe('useChartSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('loads the chart defaults', () => {
    expect(useChartSettingsStore().chartConfig).toEqual({
      priceStyle: 'candles',
      volumeStyle: 'heatmap',
      heatmapVariant: 'flow',
      colormap: 'green',
      showMarkers: true,
      showReferenceLines: true,
      showTooltip: true,
    });
  });

  it('merges a partial chart config without resetting untouched fields', () => {
    const store = useChartSettingsStore();
    store.setChartConfig({ priceStyle: 'line', showTooltip: false });
    expect(store.chartConfig.priceStyle).toBe('line');
    expect(store.chartConfig.showTooltip).toBe(false);
    expect(store.chartConfig.volumeStyle).toBe('heatmap');
    expect(store.chartConfig.showMarkers).toBe(true);
  });
});
