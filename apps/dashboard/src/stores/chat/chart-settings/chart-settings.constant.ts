import type { ChartConfig } from './chart-settings.model';

export const CHART_CONFIG_KEY = 'harness-chart-config';

/** Chart rendering defaults. */
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  priceStyle: 'candles',
  volumeStyle: 'heatmap',
  heatmapVariant: 'flow',
  colormap: 'green',
  showMarkers: true,
  showReferenceLines: true,
  showTooltip: true,
};
