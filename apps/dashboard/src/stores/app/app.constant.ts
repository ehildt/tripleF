import type { ChartConfig, ChatIconVisibility } from '../../types/app.model';

/** Chat icon visibility defaults — everything on until the user toggles. */
export const DEFAULT_CHAT_ICON_VISIBILITY: ChatIconVisibility = {
  copy: true,
  include: true,
  branch: true,
  delete: true,
};

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

/** localStorage key for the persisted star toggle. */
export const STAR_KEY = 'harness-chat-star';
