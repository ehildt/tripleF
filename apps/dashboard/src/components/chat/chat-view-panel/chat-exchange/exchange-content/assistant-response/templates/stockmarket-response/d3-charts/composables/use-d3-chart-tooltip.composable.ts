import { onBeforeUnmount, ref, watch } from 'vue';

import type { ChartTooltipState } from '../../shared/chart-tooltip/ChartTooltip.types';
import { computeTooltipPosition } from '../../shared/chart-tooltip/compute-tooltip-position.helper';
import type { D3CrosshairEvent } from './use-d3-chart.composable.types';
import type { UseD3ChartTooltipOptions } from './use-d3-chart-tooltip.composable.types';

/** Fallback footprint when the tooltip element is not (yet) measurable. */
const TOOLTIP_WIDTH = 140;
const TOOLTIP_HEIGHT = 92;

/**
 * Turns the chart's crosshair into a floating, cursor-anchored tooltip. Tracks
 * the hovered bar's data and clamps the panel so it stays inside the chart
 * container. Subscribes to the engine's crosshair events and tears the
 * subscription down on unmount.
 */
export function useD3ChartTooltip(options: UseD3ChartTooltipOptions) {
  const tooltip = ref<ChartTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    rows: [],
  });

  function handleCrosshair(event: D3CrosshairEvent | null): void {
    const container = options.containerRef.value;
    if (!event || !container || options.enabled?.value === false) {
      tooltip.value.visible = false;
      return;
    }
    const rows = options.buildRows(event);
    if (!rows || rows.length === 0) {
      tooltip.value.visible = false;
      return;
    }

    // Measure the panel's real size (it is always mounted and visibility-
    // hidden, so layout metrics are available) and let it decide the flip.
    const el = options.tooltipRef?.value?.rootEl ?? null;
    const width = el?.offsetWidth || TOOLTIP_WIDTH;
    const height = el?.offsetHeight || TOOLTIP_HEIGHT;
    const { x, y } = computeTooltipPosition(
      { x: event.x, y: event.y },
      width,
      height,
      container.clientWidth,
      container.clientHeight,
    );

    tooltip.value = { visible: true, x, y, rows };
  }

  const unsubscribe = options.engine.onCrosshair(handleCrosshair);
  onBeforeUnmount(unsubscribe);

  // Toggling the tooltip off hides the panel immediately, without waiting
  // for the pointer to leave or move over the chart again.
  if (options.enabled) {
    const stop = watch(options.enabled, (enabled) => {
      if (!enabled) tooltip.value.visible = false;
    });
    onBeforeUnmount(stop);
  }

  return { tooltip };
}
