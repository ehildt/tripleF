import type { Selection } from 'd3-selection';
import { area, line } from 'd3-shape';
import { computed, type Ref } from 'vue';

import type { D3StackedAreaSeries } from '../D3Chart.types';
import {
  buildStackedAreaData,
  type StackedAreaDay,
} from '../helpers/build-stacked-area-data.helper';
import { computeCumulativeTops } from '../helpers/compute-cumulative-tops.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import {
  type D3ChartRenderContext,
  useD3Chart,
} from './use-d3-chart.composable';

/** Line/area palette for the stacked series, in draw order. */
export const STACKED_AREA_PALETTE = [
  'var(--color-accent-primary)',
  'var(--color-harmony-1)',
  'var(--color-harmony-2)',
  'var(--color-harmony-3)',
  'var(--color-harmony-4)',
  'var(--color-status-success)',
  'var(--color-status-warning)',
  'var(--color-status-info)',
];

export interface UseD3StackedAreaChartOptions {
  /** Where the chart canvas mounts (bound by the component's template). */
  containerRef: Ref<HTMLDivElement | null>;
  series: Ref<D3StackedAreaSeries[]>;
  /** normalized = each series rebased to 100; raw = original values. */
  mode?: Ref<'normalized' | 'raw' | undefined>;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
}

/**
 * Owns the state and rendering of the stacked-area chart on the D3 engine:
 * the normalized/raw data preparation, the per-series cumulative stacking,
 * and the legend palette.
 */
export function useD3StackedAreaChart(options: UseD3StackedAreaChartOptions) {
  /** One day per union time, values normalized or raw, carried forward. */
  const stackedData = computed<StackedAreaDay[]>(() =>
    buildStackedAreaData(
      options.series.value,
      options.mode?.value ?? 'normalized',
    ),
  );

  const engine = useD3Chart({
    containerRef: options.containerRef,
    getDataLength: () => stackedData.value.length,
    // The engine derives the price domain from these per-bar extremes; the
    // stacked chart's y axis must span the tallest cumulative stack.
    getPoint: (index) => {
      const day = stackedData.value[index];
      if (!day) return undefined;
      return {
        time: day.time,
        high: Math.max(0, ...computeCumulativeTops(day)),
        low: 0,
        volume: 0,
      };
    },
    formatPrice: (value) => value.toFixed(0),
    onRangeRequest: options.onRangeRequest,
    volumeSplit: () => false,
    markerHeadroomPx: () => 0,
    watchSources: () => [options.series.value, options.mode?.value],
    render: renderChart,
  });

  // ---- Rendering -------------------------------------------------------------

  function layerGroup(
    ctx: D3ChartRenderContext,
    className: string,
  ): Selection<SVGGElement, unknown, null, undefined> {
    const existing = ctx.svg.select<SVGGElement>(`g.${className}`);
    if (!existing.empty()) return existing;
    return ctx.svg.append('g').attr('class', className);
  }

  function updatePath(
    group: Selection<SVGGElement, unknown, null, undefined>,
    className: string,
    attrs: Record<string, string | number>,
  ): Selection<SVGPathElement, unknown, null, undefined> {
    let path = group.select<SVGPathElement>(`path.${className}`);
    if (path.empty()) path = group.append('path').attr('class', className);
    for (const [name, value] of Object.entries(attrs)) path.attr(name, value);
    return path;
  }

  /** Rebuild the stack paths from scratch when the series count changes. */
  let lastSeriesCount = -1;

  function renderChart(ctx: D3ChartRenderContext): void {
    const days = stackedData.value;
    const seriesCount = options.series.value.length;
    const group = layerGroup(ctx, 'd3-chart__stacks');
    if (lastSeriesCount !== seriesCount) {
      group.selectAll('*').remove();
      lastSeriesCount = seriesCount;
    }
    if (seriesCount === 0 || days.length === 0) return;

    const indexOf = new Map(days.map((day, i) => [day, i] as const));
    const indexed = days.map(
      (day) => [day, computeCumulativeTops(day)] as [StackedAreaDay, number[]],
    );

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const colorVar =
        STACKED_AREA_PALETTE[seriesIndex % STACKED_AREA_PALETTE.length];
      const areaGen = area<[StackedAreaDay, number[]]>()
        .x(([day]) => ctx.x(indexOf.get(day) ?? 0))
        .y0(([, tops]) =>
          seriesIndex === 0 ? ctx.y(0) : ctx.y(tops[seriesIndex - 1] ?? 0),
        )
        .y1(([, tops]) => ctx.y(tops[seriesIndex] ?? 0));
      const lineGen = line<[StackedAreaDay, number[]]>()
        .x(([day]) => ctx.x(indexOf.get(day) ?? 0))
        .y(([, tops]) => ctx.y(tops[seriesIndex] ?? 0));

      updatePath(group, `d3-chart__stack-area--${seriesIndex}`, {
        d: areaGen(indexed) ?? '',
        fill: resolveColor(colorVar, 0.28),
      });
      updatePath(group, `d3-chart__stack-line--${seriesIndex}`, {
        d: lineGen(indexed) ?? '',
        fill: 'none',
        stroke: resolveColor(colorVar, 1),
        'stroke-width': 2,
      });
    }
  }

  return {
    STACKED_AREA_PALETTE,
    zoomIn: engine.zoomIn,
    zoomOut: engine.zoomOut,
    reset: engine.reset,
    setRange: engine.setRange,
  };
}
