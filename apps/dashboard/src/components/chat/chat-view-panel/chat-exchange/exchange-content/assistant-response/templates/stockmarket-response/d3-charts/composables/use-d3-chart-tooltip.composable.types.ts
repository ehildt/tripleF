import type { Ref } from 'vue';

import type { ChartTooltipRow } from '../../shared/chart-tooltip/ChartTooltip.types';
import type { D3CrosshairEvent } from './use-d3-chart.composable.types';

/** The chart-engine surface the tooltip subscribes to. */
export interface D3ChartEngineTooltip {
  onCrosshair: (
    listener: (event: D3CrosshairEvent | null) => void,
  ) => () => void;
}

export interface UseD3ChartTooltipOptions {
  /** Where the chart canvas is mounted (used to clamp the tooltip in bounds). */
  containerRef: Ref<HTMLDivElement | null>;
  /** The D3 chart engine, which emits crosshair events on pointer move. */
  engine: D3ChartEngineTooltip;
  /**
   * The tooltip panel's root element (exposed by `ChartTooltip`), measured so
   * the panel's real width/height decide the before/after flip and clamps.
   */
  tooltipRef?: Ref<{ rootEl: HTMLElement | null } | null>;
  /**
   * Build the tooltip rows from the hovered bar. Return `null` (or an empty
   * array) to keep the tooltip hidden for that position.
   */
  buildRows: (event: D3CrosshairEvent) => ChartTooltipRow[] | null;
  /**
   * Whether the tooltip is enabled. When `false`, crosshair moves keep the
   * panel hidden and rows are never built. Defaults to enabled.
   */
  enabled?: Ref<boolean>;
}
