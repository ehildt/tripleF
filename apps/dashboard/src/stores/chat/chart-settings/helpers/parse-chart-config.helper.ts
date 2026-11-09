import { DEFAULT_CHART_CONFIG } from '../chart-settings.constant';
import type { ChartConfig } from '../chart-settings.model';

/** Parse chart preferences, accepting only documented enum/boolean fields. */
export function parseChartConfig(raw: string | null): ChartConfig {
  const config = { ...DEFAULT_CHART_CONFIG };
  if (!raw) return config;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return config;
    }
    const saved = parsed as Record<string, unknown>;
    if (
      saved.priceStyle === 'candles' ||
      saved.priceStyle === 'line' ||
      saved.priceStyle === 'area'
    ) {
      config.priceStyle = saved.priceStyle;
    }
    if (saved.volumeStyle === 'histogram' || saved.volumeStyle === 'heatmap') {
      config.volumeStyle = saved.volumeStyle;
    }
    if (saved.heatmapVariant === 'cells' || saved.heatmapVariant === 'flow') {
      config.heatmapVariant = saved.heatmapVariant;
    }
    if (
      saved.colormap === 'turbo' ||
      saved.colormap === 'green' ||
      saved.colormap === 'purple'
    ) {
      config.colormap = saved.colormap;
    }
    if (typeof saved.showMarkers === 'boolean') {
      config.showMarkers = saved.showMarkers;
    }
    if (typeof saved.showReferenceLines === 'boolean') {
      config.showReferenceLines = saved.showReferenceLines;
    }
    if (typeof saved.showTooltip === 'boolean') {
      config.showTooltip = saved.showTooltip;
    }
    return config;
  } catch {
    return config;
  }
}
