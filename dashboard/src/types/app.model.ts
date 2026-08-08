export type ActiveTab = 'chat' | 'dlq' | 'debug' | 'sysctl';

/** How a conversation's exchange list is scrolled: the full-page vertical
 * carousel (crossfading sections) or the native continuous scroll list. */
export type ScrollMode = 'carousel' | 'native';

/** Which action icons are shown on the user-prompt header and the history
 * items. Each can be toggled from the SysCtl chat-navigation tab. */
export interface ChatIconVisibility {
  copy: boolean;
  include: boolean;
  branch: boolean;
  delete: boolean;
}

export type ChatIconKey = keyof ChatIconVisibility;

/** Default chart style preferences, set from the SysCtl chat-navigation tab. */
export type ChartPriceStyle = 'candles' | 'line' | 'area';
export type ChartVolumeStyle = 'histogram' | 'heatmap';
export type ChartHeatmapVariant = 'cells' | 'flow';
export type ChartColormap = 'turbo' | 'green' | 'purple';

/** Global defaults every stock chart inherits unless overridden per chart. */
export interface ChartConfig {
  priceStyle: ChartPriceStyle;
  volumeStyle: ChartVolumeStyle;
  heatmapVariant: ChartHeatmapVariant;
  colormap: ChartColormap;
  showMarkers: boolean;
  showReferenceLines: boolean;
  showTooltip: boolean;
}
