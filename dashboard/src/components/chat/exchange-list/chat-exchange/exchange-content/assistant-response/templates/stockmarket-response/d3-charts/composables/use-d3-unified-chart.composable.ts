import { scaleLinear } from 'd3-scale';
import { select, type Selection } from 'd3-selection';
import { line } from 'd3-shape';
import { computed, type Ref, ref, watch } from 'vue';

import { buildChangeLabel } from '../../helpers/build-change-label.helper';
import type { ChartTooltipRow } from '../../shared/chart-tooltip/ChartTooltip.types';
import type {
  D3ChartDefaultConfig,
  D3ChartMarker,
  D3ChartPoint,
  D3HeatmapVariant,
  D3PriceStyle,
  D3ReferenceLine,
  D3VolumeProfilePoint,
  D3VolumeStyle,
} from '../D3Chart.types';
import {
  buildHeatmapCells,
  type HeatmapDayCells,
} from '../helpers/build-heatmap-cells.helper';
import {
  buildHlcAreaPaths,
  type HlcPoint,
} from '../helpers/build-hlc-area-paths.helper';
import {
  buildMarkerLayouts,
  type MarkerLayout,
} from '../helpers/build-marker-layout.helper';
import { buildPivotMarkers } from '../helpers/build-pivot-markers.helper';
import { buildPriceFormatter } from '../helpers/build-price-formatter.helper';
import { buildRangeLabel } from '../helpers/build-range-label.helper';
import { clampToPlot } from '../helpers/clamp-to-plot.helper';
import { computeBarSpacing } from '../helpers/compute-bar-spacing.helper';
import {
  computeFlowColumns,
  type FlowColumn,
} from '../helpers/compute-flow-columns.helper';
import { computeSimpleMovingAverage } from '../helpers/compute-simple-moving-average.helper';
import { dedupeReferenceLines } from '../helpers/dedupe-reference-lines.helper';
import { dodgeBadgePositions } from '../helpers/dodge-badge-positions.helper';
import { ensureExtremeReferenceLines } from '../helpers/ensure-extreme-reference-lines.helper';
import { filterReferenceLinesInRange } from '../helpers/filter-reference-lines-in-range.helper';
import { filterReferenceLinesInWindow } from '../helpers/filter-reference-lines-in-window.helper';
import { forceExtremeMarkers } from '../helpers/force-extreme-markers.helper';
import { formatVolume } from '../helpers/format-volume.helper';
import { hasIntradayTimes } from '../helpers/has-intraday-times.helper';
import {
  formatRgba,
  greenColor,
  purpleColor,
  type RgbaColor,
  turboColor,
} from '../helpers/heatmap-shaders.helper';
import { isExtremeAnnotation } from '../helpers/is-extreme-annotation.helper';
import { isMovingAverageReferenceLine } from '../helpers/is-moving-average-reference-line.helper';
import { markerTextShift } from '../helpers/marker-text-shift.helper';
import { mergeDuplicateReferenceLines } from '../helpers/merge-duplicate-reference-lines.helper';
import { mergeMarkerLayouts } from '../helpers/merge-marker-layouts.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { resolveMarkerSymbolPath } from '../helpers/resolve-marker-symbol-path.helper';
import { resolveTokenColor } from '../helpers/resolve-token-color.helper';
import {
  type SplitMarkerText,
  splitMarkerText,
} from '../helpers/split-marker-text.helper';
import { stackMarkerLayouts } from '../helpers/stack-marker-layouts.helper';
import {
  type D3ChartRenderContext,
  type D3CrosshairEvent,
  DEFAULT_RANGE_BARS,
  useD3Chart,
} from './use-d3-chart.composable';
import { useD3ChartTooltip } from './use-d3-chart-tooltip.composable';

/** Number of fixed price bands spanning the full visible price range. */
const BAND_COUNT = 10;
/** Moving-average period overlaid on the price series. */
const MA_LENGTH = 20;
/**
 * Extra top/bottom scale margin (px) so marker text labels above the highest
 * price stay inside the pane — the price scale reserves space for the marker
 * shapes and their labels.
 */
const MARKER_TEXT_MARGIN = 44;

/** The preset range label for a selected bar count (engine `activeBars`). */
const SELECTED_LABEL_BY_BARS: Record<number, string> = {
  5: '1W',
  22: '1M',
  66: '3M',
  132: '6M',
  252: '1Y',
  504: '2Y',
  1260: '5Y',
};

export interface UseD3UnifiedChartOptions {
  /** Where the chart canvas mounts (bound by the component's template). */
  containerRef: Ref<HTMLDivElement | null>;
  /** The tooltip panel's root element, exposed by `ChartTooltip`. */
  tooltipRef: Ref<{ rootEl: HTMLElement | null } | null>;
  history: Ref<D3ChartPoint[]>;
  currency?: Ref<string | undefined>;
  referenceLines?: Ref<D3ReferenceLine[] | undefined>;
  markers?: Ref<D3ChartMarker[] | undefined>;
  volumeProfile?: Ref<D3VolumeProfilePoint[] | undefined>;
  /** The ticker's available date range from the cached history database. */
  availableRange?: Ref<{ from: string; to: string } | null | undefined>;
  colormap?: Ref<'turbo' | 'green' | 'purple' | undefined>;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  /** Whether the 1D (intraday) view is active. */
  intradayActive?: Ref<boolean | undefined>;
  /** Default style/annotation preferences applied when the chart mounts. */
  initialConfig?: D3ChartDefaultConfig;
  quotePrice?: Ref<number | undefined>;
  quoteChange?: Ref<number | undefined>;
  quoteChangeP?: Ref<number | undefined>;
  /** i18n translate for the tooltip row labels. */
  t: (key: string) => string;
}

/**
 * Owns the state and rendering of the unified stock chart on the D3 engine:
 * the price/volume style switches, the heatmap data and flow geometry, the
 * moving average, the reference-line badges, the buy/sell markers, the
 * crosshair tooltip, and the legend/change labels for the menu bar.
 */
export function useD3UnifiedChart(options: UseD3UnifiedChartOptions) {
  const { t } = options;

  const priceStyle = ref<D3PriceStyle>(
    options.initialConfig?.priceStyle ?? 'candles',
  );
  const volumeStyle = ref<D3VolumeStyle>(
    options.initialConfig?.volumeStyle ?? 'heatmap',
  );
  const heatmapVariant = ref<D3HeatmapVariant>(
    options.initialConfig?.heatmapVariant ?? 'flow',
  );
  /** Whether the buy/sell support & resistance markers are visible. */
  const showMarkers = ref(options.initialConfig?.showMarkers ?? true);
  /** Whether the reference-line badges (resistance/support levels) are visible. */
  const showReferenceLines = ref(
    options.initialConfig?.showReferenceLines ?? true,
  );
  /** Whether the crosshair's floating tooltip panel is shown. */
  const showTooltip = ref(options.initialConfig?.showTooltip ?? true);

  /** Heat color components for the active colormap. */
  const currentColor = computed((): ((amount: number) => RgbaColor) => {
    if (options.colormap?.value === 'turbo') return turboColor;
    if (options.colormap?.value === 'purple') return purpleColor;
    return greenColor;
  });

  function cellShader(amount: number): string {
    return formatRgba(currentColor.value(amount));
  }

  // ---- Memoized data (rebuilt only when the sources change) ----------------

  /** One heatmap column per history day, on the global price-band grid. */
  const heatmapData = computed<HeatmapDayCells[]>(() =>
    buildHeatmapCells(
      options.history.value,
      options.volumeProfile?.value,
      BAND_COUNT,
    ),
  );

  /** Flow-ribbon geometry per day, smoothed across the full history. */
  const flowColumns = computed<FlowColumn[]>(() => {
    const days = heatmapData.value;
    if (days.length === 0) return [];
    let lo = Infinity;
    let hi = -Infinity;
    for (const day of days) {
      for (const cell of day.cells) {
        if (cell.low < lo) lo = cell.low;
        if (cell.high > hi) hi = cell.high;
      }
    }
    const minHalfWidth = (hi - lo || 1) * 0.015;
    return computeFlowColumns(
      days.map((day) => day.cells),
      3,
      minHalfWidth,
    );
  });

  /** Moving average aligned to the history (undefined before the window fills). */
  const movingAverage = computed<Array<number | undefined>>(() =>
    computeSimpleMovingAverage(
      options.history.value.map((point) => point.close),
      MA_LENGTH,
    ),
  );

  /** Whether the loaded history is intraday (1D) rather than daily bars. */
  const intradaySeries = computed(() => {
    const points = options.history.value;
    return hasIntradayTimes((index) => points[index]?.time, 0, points.length);
  });

  /** The model's reference lines: deduped, moving averages excluded. */
  const baseReferenceLines = computed(() =>
    dedupeReferenceLines(
      (options.referenceLines?.value ?? []).filter(
        (line) => !isMovingAverageReferenceLine(line),
      ),
    ),
  );

  /**
   * The visible bar window `[from, to)` the engine updates on every render,
   * so the range-based ATH/ATL annotations follow the selected range (and
   * any zoom/pan).
   */
  const visibleWindow = ref<{ from: number; to: number }>({ from: 0, to: 0 });

  // ---- Engine + tooltip ------------------------------------------------------

  const engine = useD3Chart({
    containerRef: options.containerRef,
    getDataLength: () => options.history.value.length,
    getPoint: (index) => options.history.value[index],
    formatPrice: buildPriceFormatter(options.currency?.value),
    onRangeRequest: options.onRangeRequest,
    volumeSplit: () => false,
    markerHeadroomPx: () => (showMarkers.value ? MARKER_TEXT_MARGIN : 0),
    getMarkerPrices: () =>
      markerLayouts.value.map((layout) => ({
        index: layout.index,
        price: layout.price,
      })),
    rightGutterWidth: () => referenceBadgeWidth() + 8,
    crosshair: true,
    visibleWindowRef: visibleWindow,
    watchSources: () => [
      options.history.value,
      options.referenceLines?.value,
      options.markers?.value,
      options.volumeProfile?.value,
    ],
    render: renderChart,
  });

  /**
   * Label of the visible range ("1W"…"5Y", "All") for the extreme
   * annotations and the range controls. A window covering the whole loaded
   * series reads "All" only when the user actually picked All (or zoomed
   * out to it); a clicked 1Y/2Y/5Y keeps its own label even on short data.
   */
  const rangeLabel = computed(() => {
    const points = options.history.value;
    const { from, to } = visibleWindow.value;
    const start = Math.max(0, from);
    const end = Math.min(points.length, to);
    const coversFull =
      points.length > 0 && start === 0 && end === points.length;
    if (coversFull && engine.activeBars.value === null) return 'All';
    return buildRangeLabel(points, from, to);
  });

  /**
   * The selected range's window (the capped range the user picked): the
   * last `activeBars` bars, or the full series for All. The extreme markers
   * stay anchored to it while the user zooms in.
   */
  const selectedWindow = computed<{ from: number; to: number }>(() => {
    const n = options.history.value.length;
    const bars = engine.activeBars.value;
    return bars === null
      ? { from: 0, to: n }
      : { from: Math.max(0, n - bars), to: n };
  });

  /** Label of the selected range ("1W"…"5Y", "All") for the extreme markers. */
  const selectedRangeLabel = computed(() => {
    const bars = engine.activeBars.value;
    if (bars === null) return 'All';
    return SELECTED_LABEL_BY_BARS[bars] ?? 'All';
  });

  /**
   * The available data span in calendar days, for the range buttons. The
   * server-reported coverage wins (it reflects the full retention, not the
   * lazily loaded window); the loaded history is the fallback.
   */
  const availableDays = computed(() => {
    const range = options.availableRange?.value;
    if (range?.from && range.to) {
      const from = Date.parse(range.from);
      const to = Date.parse(range.to);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        return Math.max(0, (to - from) / (24 * 60 * 60 * 1000));
      }
    }
    const points = options.history.value;
    if (points.length < 2) return 0;
    const from = Date.parse(points[0].time);
    const to = Date.parse(points[points.length - 1].time);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
    return Math.max(0, (to - from) / (24 * 60 * 60 * 1000));
  });

  /** Model annotations merged into the pivot buy/sell marker layer. */
  const markerLayouts = computed<MarkerLayout[]>(() => {
    const points = options.history.value;
    const pivots = buildMarkerLayouts(
      buildPivotMarkers(points, {
        buy: resolveColor('var(--color-status-success)', 1),
        sell: resolveColor('var(--color-status-error)', 1),
      }),
      points,
    );
    // The chart owns the ATH/ATL annotations: model-emitted extreme markers
    // ("ATH @ …", "52W ATH @ …", "12y ATH @ …") are dropped so the generated
    // range-based bullets never duplicate them.
    const explicit = (options.markers?.value ?? []).filter(
      (marker) => !isExtremeAnnotation(marker.text),
    );
    const merged = explicit.length
      ? mergeMarkerLayouts(
          buildMarkerLayouts(
            explicit.map((marker) => ({
              time: marker.time,
              position: marker.position,
              color: resolveTokenColor(marker.color, 1),
              shape: marker.shape,
              text: marker.text,
            })),
            points,
          ),
          pivots,
        )
      : pivots;
    // The selected range's extremes get their canonical bullets in a
    // distinguished tone (purple high, teal low), matching their level
    // lines. (Skipped on intraday views.)
    if (intradaySeries.value) return merged;
    const fmt = buildPriceFormatter(options.currency?.value);
    const extremes = forceExtremeMarkers(
      merged,
      points,
      selectedWindow.value,
      selectedRangeLabel.value,
      {
        high: resolveColor('var(--color-harmony-2)', 1),
        low: resolveColor('var(--color-harmony-4)', 1),
      },
      fmt,
    );
    // Pin the selected-range extremes to the visible window so they never
    // disappear while the user zooms in past their bars.
    const { from, to } = visibleWindow.value;
    if (to <= from) return extremes;
    return extremes.map((layout) =>
      layout.pinToWindow
        ? { ...layout, index: Math.min(to - 1, Math.max(from, layout.index)) }
        : layout,
    );
  });

  /**
   * Reference lines reduced to levels that actually occur in the charted
   * history. Model-emitted levels are occasionally off-data (e.g. a
   * web-searched all-time high); drawing those would float the badge above
   * everything, so out-of-range levels are dropped. The visible range's
   * extremes are replaced by the canonical "{label} ATH" / "{label} ATL"
   * annotations. Lines that land on the same price (e.g. a model "52W LOW"
   * re-emitting the generated "1W LOW") merge into a single line with a
   * combined badge ("1W / 52W LOW") so labels and dashed lines never stack.
   */
  const rangedReferenceLines = computed(() =>
    filterReferenceLinesInWindow(
      filterReferenceLinesInRange(
        mergeDuplicateReferenceLines(
          ensureExtremeReferenceLines(
            baseReferenceLines.value,
            options.history.value,
            visibleWindow.value,
            rangeLabel.value,
            !intradaySeries.value,
          ),
        ),
        options.history.value,
      ),
      options.history.value,
      visibleWindow.value.from,
      visibleWindow.value.to,
    ),
  );

  /**
   * Width of the widest reference-line badge (label + value), so the engine
   * can size the right gutter and the badges never clip at the svg edge.
   */
  function referenceBadgeWidth(): number {
    const fmt = buildPriceFormatter(options.currency?.value);
    const levels = rangedReferenceLines.value;
    let max = 0;
    for (const level of levels) {
      const text = level.label
        ? `${level.label} ${fmt(level.value)}`
        : fmt(level.value);
      max = Math.max(max, text.length * 6 + 12);
    }
    // The gutter holds the price-axis labels plus the widest badge, so
    // neither clips at the svg edge.
    return max + 46 + 4;
  }

  // ---- Engine + tooltip ------------------------------------------------------

  /** Tooltip rows for the hovered bar, per the active price style. */
  function buildTooltipRows(event: D3CrosshairEvent): ChartTooltipRow[] | null {
    const point = options.history.value[event.index];
    if (!point) return null;
    const fmt = buildPriceFormatter(options.currency?.value);
    const volumeRow: ChartTooltipRow = {
      label: t('common.chartVolume'),
      value: formatVolume(point.volume),
    };
    if (priceStyle.value === 'candles') {
      const changeColor = resolveColor(
        point.close >= point.open
          ? 'var(--color-status-success)'
          : 'var(--color-status-error)',
        1,
      );
      return [
        { label: t('common.chartOpen'), value: fmt(point.open) },
        { label: t('common.chartHigh'), value: fmt(point.high) },
        { label: t('common.chartLow'), value: fmt(point.low) },
        {
          label: t('common.chartClose'),
          value: fmt(point.close),
          color: changeColor,
        },
        volumeRow,
      ];
    }
    if (priceStyle.value === 'line') {
      return [
        { label: t('common.chartClose'), value: fmt(point.close) },
        volumeRow,
      ];
    }
    return [
      { label: t('common.chartHigh'), value: fmt(point.high) },
      { label: t('common.chartLow'), value: fmt(point.low) },
      { label: t('common.chartClose'), value: fmt(point.close) },
      volumeRow,
    ];
  }

  const { tooltip } = useD3ChartTooltip({
    containerRef: options.containerRef,
    engine: { onCrosshair: engine.onCrosshair },
    tooltipRef: options.tooltipRef,
    buildRows: buildTooltipRows,
    enabled: showTooltip,
  });

  // ---- Rendering -------------------------------------------------------------

  /** Track the style a layer group was last drawn with, to clear it on change. */
  let lastPriceStyle: D3PriceStyle | null = null;
  let lastVolumeStyle: D3VolumeStyle | null = null;
  let lastHeatmapVariant: D3HeatmapVariant | null = null;

  function layerGroup(
    ctx: D3ChartRenderContext,
    className: string,
  ): Selection<SVGGElement, unknown, null, undefined> {
    const existing = ctx.svg.select<SVGGElement>(`g.${className}`);
    if (!existing.empty()) return existing;
    return ctx.svg.append('g').attr('class', className);
  }

  function clearGroups(
    ctx: D3ChartRenderContext,
    ...classNames: string[]
  ): void {
    for (const className of classNames) {
      const group = ctx.svg.select<SVGGElement>(`g.${className}`);
      if (!group.empty()) group.selectAll('*').remove();
    }
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

  function renderChart(ctx: D3ChartRenderContext): void {
    drawPriceSeries(ctx);
    drawVolumeSeries(ctx);
    drawMovingAverage(ctx);
    drawReferenceLines(ctx);
    drawMarkers(ctx);
  }

  // Price series: candles / line / HLC area.

  function drawPriceSeries(ctx: D3ChartRenderContext): void {
    if (lastPriceStyle !== priceStyle.value) {
      if (lastPriceStyle !== null) {
        clearGroups(
          ctx,
          'd3-chart__candles',
          'd3-chart__line',
          'd3-chart__hlc',
        );
      }
      lastPriceStyle = priceStyle.value;
    }
    if (priceStyle.value === 'candles') drawCandles(ctx);
    else if (priceStyle.value === 'line') drawLine(ctx);
    else drawHlcArea(ctx);
  }

  function drawCandles(ctx: D3ChartRenderContext): void {
    const up = resolveColor('var(--color-status-success)', 1);
    const down = resolveColor('var(--color-status-error)', 1);
    const bodyWidth = Math.max(
      1,
      computeBarSpacing(
        ctx.plot.right - ctx.plot.left,
        ctx.visibleTo - ctx.visibleFrom,
      ) * 0.8,
    );
    const group = layerGroup(ctx, 'd3-chart__candles');
    const visible = options.history.value.slice(ctx.visibleFrom, ctx.visibleTo);
    const bars = group
      .selectAll<SVGGElement, D3ChartPoint>('g.d3-chart__candle')
      .data(visible, (point) => point.time);
    bars.exit().remove();
    const enter = bars.enter().append('g').attr('class', 'd3-chart__candle');
    enter.append('line').attr('class', 'd3-chart__wick');
    enter.append('rect').attr('class', 'd3-chart__body');
    bars.merge(enter).each(function (point, i) {
      const index = ctx.visibleFrom + i;
      const x = ctx.x(index);
      const color = point.close >= point.open ? up : down;
      select(this)
        .select('.d3-chart__wick')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', ctx.y(point.high))
        .attr('y2', ctx.y(point.low))
        .attr('stroke', color)
        .attr('stroke-width', 1);
      const yOpen = ctx.y(point.open);
      const yClose = ctx.y(point.close);
      // Clamp the body inside the plot so edge candles never bleed into the
      // y-axis gutter when zoomed in.
      const bodyLeft = Math.max(
        ctx.plot.left,
        Math.min(x - bodyWidth / 2, ctx.plot.right),
      );
      const bodyRight = Math.max(
        ctx.plot.left,
        Math.min(x + bodyWidth / 2, ctx.plot.right),
      );
      select(this)
        .select('.d3-chart__body')
        .attr('x', bodyLeft)
        .attr('width', Math.max(0, bodyRight - bodyLeft))
        .attr('y', Math.min(yOpen, yClose))
        .attr('height', Math.max(1, Math.abs(yClose - yOpen)))
        .attr('fill', color);
    });
  }

  function drawLine(ctx: D3ChartRenderContext): void {
    const group = layerGroup(ctx, 'd3-chart__line');
    const visible = options.history.value.slice(ctx.visibleFrom, ctx.visibleTo);
    const lineGen = line<D3ChartPoint>()
      .x((_point, i) => ctx.x(ctx.visibleFrom + i))
      .y((point) => ctx.y(point.close))
      .defined((point) => Number.isFinite(point.close));
    group
      .selectAll('path')
      .data([visible])
      .join('path')
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', resolveColor('var(--color-accent-primary)', 1))
      .attr('stroke-width', 2);
  }

  function drawHlcArea(ctx: D3ChartRenderContext): void {
    const visible = options.history.value.slice(ctx.visibleFrom, ctx.visibleTo);
    const pixelPoints: HlcPoint[] = visible.map((point, i) => ({
      x: ctx.x(ctx.visibleFrom + i),
      high: ctx.y(point.high),
      low: ctx.y(point.low),
      close: ctx.y(point.close),
    }));
    const paths = buildHlcAreaPaths(pixelPoints);
    const group = layerGroup(ctx, 'd3-chart__hlc');
    updatePath(group, 'd3-chart__hlc-area--top', {
      d: paths.topArea,
      fill: resolveColor('var(--color-status-success)', 0.2),
    });
    updatePath(group, 'd3-chart__hlc-area--bottom', {
      d: paths.bottomArea,
      fill: resolveColor('var(--color-status-error)', 0.2),
    });
    updatePath(group, 'd3-chart__hlc-line--high', {
      d: paths.highLine,
      fill: 'none',
      stroke: resolveColor('var(--color-status-success)', 1),
      'stroke-width': 1,
    });
    updatePath(group, 'd3-chart__hlc-line--low', {
      d: paths.lowLine,
      fill: 'none',
      stroke: resolveColor('var(--color-status-error)', 1),
      'stroke-width': 1,
    });
    updatePath(group, 'd3-chart__hlc-line--close', {
      d: paths.closeLine,
      fill: 'none',
      stroke: resolveColor('var(--color-fg-muted)', 1),
      'stroke-width': 1,
    });
  }

  // Volume series: histogram or heatmap (cells / flow).

  function drawVolumeSeries(ctx: D3ChartRenderContext): void {
    if (lastVolumeStyle !== volumeStyle.value) {
      if (lastVolumeStyle !== null) {
        clearGroups(
          ctx,
          'd3-chart__volume',
          'd3-chart__heatmap',
          'd3-chart__flow',
        );
      }
      lastVolumeStyle = volumeStyle.value;
      lastHeatmapVariant = null;
    }
    if (
      volumeStyle.value === 'heatmap' &&
      lastHeatmapVariant !== heatmapVariant.value
    ) {
      clearGroups(ctx, 'd3-chart__heatmap', 'd3-chart__flow');
      lastHeatmapVariant = heatmapVariant.value;
    }
    if (volumeStyle.value === 'histogram') drawVolumeHistogram(ctx);
    else if (heatmapVariant.value === 'cells') drawHeatmapCells(ctx);
    else drawHeatmapFlow(ctx);
  }

  function drawVolumeHistogram(ctx: D3ChartRenderContext): void {
    const up = resolveColor('var(--color-status-success)', 1);
    const down = resolveColor('var(--color-status-error)', 1);
    const barWidth = Math.max(
      1,
      computeBarSpacing(
        ctx.plot.right - ctx.plot.left,
        ctx.visibleTo - ctx.visibleFrom,
      ) * 0.8,
    );
    const visible = options.history.value.slice(ctx.visibleFrom, ctx.visibleTo);
    // The volume bars share the single price y-axis: they sit in the bottom
    // quarter of the price pane, scaled to the visible volume range.
    const maxVolume = Math.max(1, ...visible.map((point) => point.volume));
    const bandTop = ctx.plot.bottom - (ctx.plot.bottom - ctx.plot.top) * 0.25;
    const volumeScale = scaleLinear()
      .domain([0, maxVolume])
      .range([ctx.plot.bottom, bandTop]);
    const zero = volumeScale(0);
    const group = layerGroup(ctx, 'd3-chart__volume');
    const bars = group
      .selectAll<SVGRectElement, D3ChartPoint>('rect.d3-chart__volume-bar')
      .data(visible, (point) => point.time);
    bars.exit().remove();
    bars
      .merge(bars.enter().append('rect').attr('class', 'd3-chart__volume-bar'))
      .attr('x', (_point, i) => {
        // Clamp the bar's left edge inside the plot: a bar centred on the
        // first visible index would otherwise bleed past the plot's left.
        const x = ctx.x(ctx.visibleFrom + i) - barWidth / 2;
        return Math.max(ctx.plot.left, Math.min(x, ctx.plot.right));
      })
      .attr('width', (_point, i) => {
        // Clamp the right edge inside the plot so the last bar never bleeds
        // into the y-axis gutter when zoomed in.
        const x = ctx.x(ctx.visibleFrom + i) - barWidth / 2;
        const left = Math.max(ctx.plot.left, Math.min(x, ctx.plot.right));
        const right = Math.max(
          ctx.plot.left,
          Math.min(x + barWidth, ctx.plot.right),
        );
        return Math.max(0, right - left);
      })
      .attr('y', (point) => volumeScale(point.volume))
      .attr('height', (point) => Math.max(0, zero - volumeScale(point.volume)))
      .attr('fill', (point) => (point.close >= point.open ? up : down));
  }

  function drawHeatmapCells(ctx: D3ChartRenderContext): void {
    const cellWidth = Math.max(
      1,
      computeBarSpacing(
        ctx.plot.right - ctx.plot.left,
        ctx.visibleTo - ctx.visibleFrom,
      ) * 0.9,
    );
    const group = layerGroup(ctx, 'd3-chart__heatmap');
    const cells: Array<{
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
    }> = [];
    for (let i = ctx.visibleFrom; i < ctx.visibleTo; i++) {
      const day = heatmapData.value[i];
      if (!day) continue;
      // Clamp the cell inside the plot so edge columns never bleed into the
      // y-axis gutter when zoomed in.
      const cellX = Math.max(
        ctx.plot.left,
        Math.min(ctx.x(i) - cellWidth / 2, ctx.plot.right),
      );
      const cellRight = Math.max(
        ctx.plot.left,
        Math.min(ctx.x(i) + cellWidth / 2, ctx.plot.right),
      );
      const clampedWidth = cellRight - cellX;
      if (clampedWidth <= 0) continue;
      for (const cell of day.cells) {
        // Clamp the cell vertically inside the plot so bands outside the
        // visible price domain never bleed into the x-axis gutter or above
        // the pane when zoomed in.
        const cellTop = Math.max(ctx.plot.top, ctx.y(cell.high));
        const cellBottom = Math.min(ctx.plot.bottom, ctx.y(cell.low));
        const clampedHeight = cellBottom - cellTop;
        if (clampedHeight <= 0) continue;
        cells.push({
          key: `${i}:${cell.low}`,
          x: cellX,
          y: cellTop,
          width: clampedWidth,
          height: clampedHeight,
          fill: cellShader(cell.amount),
        });
      }
    }
    group
      .selectAll<SVGRectElement, (typeof cells)[number]>(
        'rect.d3-chart__heatmap-cell',
      )
      .data(cells, (cell) => cell.key)
      .join((enter) =>
        enter.append('rect').attr('class', 'd3-chart__heatmap-cell'),
      )
      .attr('x', (cell) => cell.x)
      .attr('y', (cell) => cell.y)
      .attr('width', (cell) => cell.width)
      .attr('height', (cell) => cell.height)
      .attr('fill', (cell) => cell.fill);
  }

  function drawHeatmapFlow(ctx: D3ChartRenderContext): void {
    const group = layerGroup(ctx, 'd3-chart__flow');
    const quads: Array<{ key: string; d: string; fill: string }> = [];
    for (let i = ctx.visibleFrom; i < ctx.visibleTo - 1; i++) {
      const a = flowColumns.value[i];
      const b = flowColumns.value[i + 1];
      if (!a || !b) continue;
      const x0 = ctx.x(i);
      const x1 = ctx.x(i + 1);
      // Clamp the ribbon into the plot so bands outside the visible price
      // domain never bleed into the x-axis gutter or above the pane when
      // zoomed in. Quads entirely outside the plot are skipped.
      const yTopA = clampToPlot(ctx.y(a.centroid + a.halfWidth), ctx.plot);
      const yTopB = clampToPlot(ctx.y(b.centroid + b.halfWidth), ctx.plot);
      const yBottomA = clampToPlot(ctx.y(a.centroid - a.halfWidth), ctx.plot);
      const yBottomB = clampToPlot(ctx.y(b.centroid - b.halfWidth), ctx.plot);
      if (
        yTopA <= ctx.plot.top &&
        yTopB <= ctx.plot.top &&
        yBottomA <= ctx.plot.top &&
        yBottomB <= ctx.plot.top
      ) {
        continue;
      }
      if (
        yTopA >= ctx.plot.bottom &&
        yTopB >= ctx.plot.bottom &&
        yBottomA >= ctx.plot.bottom &&
        yBottomB >= ctx.plot.bottom
      ) {
        continue;
      }
      quads.push({
        key: String(i),
        d: `M ${x0} ${yTopA} L ${x1} ${yTopB} L ${x1} ${yBottomB} L ${x0} ${yBottomA} Z`,
        fill: cellShader(((a.intensity + b.intensity) / 2) * 100),
      });
    }
    group
      .selectAll<SVGPathElement, (typeof quads)[number]>(
        'path.d3-chart__flow-quad',
      )
      .data(quads, (quad) => quad.key)
      .join((enter) =>
        enter.append('path').attr('class', 'd3-chart__flow-quad'),
      )
      .attr('d', (quad) => quad.d)
      .attr('fill', (quad) => quad.fill);
  }

  // Moving average overlay.

  function drawMovingAverage(ctx: D3ChartRenderContext): void {
    const group = layerGroup(ctx, 'd3-chart__ma');
    const visible = options.history.value.slice(ctx.visibleFrom, ctx.visibleTo);
    const lineGen = line<D3ChartPoint>()
      .x((_point, i) => ctx.x(ctx.visibleFrom + i))
      .y((_point, i) => ctx.y(movingAverage.value[ctx.visibleFrom + i] ?? NaN))
      .defined(
        (_point, i) => movingAverage.value[ctx.visibleFrom + i] !== undefined,
      );
    group
      .selectAll('path')
      .data([visible])
      .join('path')
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', resolveColor('var(--color-accent-primary)', 1))
      .attr('stroke-width', 1);
  }

  /**
   * The x of the visible bar whose price is closest to the level — where the
   * dashed line crosses the actual value (the extreme bar for HIGH/LOW
   * lines, the tested bar for support/resistance). Falls back to the plot's
   * left edge when no bar is visible.
   */
  function nearestBarX(ctx: D3ChartRenderContext, value: number): number {
    let bestIndex = -1;
    let bestDiff = Infinity;
    for (let i = ctx.visibleFrom; i < ctx.visibleTo; i++) {
      const point = options.history.value[i];
      if (!point) continue;
      const diff = Math.min(
        Math.abs(point.high - value),
        Math.abs(point.low - value),
        Math.abs(point.close - value),
      );
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }
    return bestIndex >= 0 ? ctx.x(bestIndex) : ctx.plot.left;
  }

  // Reference lines with right-axis value badges.

  function drawReferenceLines(ctx: D3ChartRenderContext): void {
    const group = layerGroup(ctx, 'd3-chart__reference-lines');
    if (!showReferenceLines.value) {
      group.selectAll('*').remove();
      return;
    }
    const levels = rangedReferenceLines.value;
    const items: Array<{
      key: string;
      y: number;
      badgeY: number;
      x: number;
      color: string;
      text: string;
    }> = [];
    for (const level of levels) {
      const y = ctx.y(level.value);
      if (y < ctx.plot.top - 10 || y > ctx.plot.bottom + 10) continue;
      items.push({
        key: String(level.value),
        y,
        badgeY: y,
        x: nearestBarX(ctx, level.value),
        color: resolveTokenColor(level.color, 1),
        text: level.label
          ? `${level.label} ${ctx.formatPrice(level.value)}`
          : ctx.formatPrice(level.value),
      });
    }
    // Near-identical levels overlap in pixel space even when their values
    // differ, so the badges dodge vertically; the dashed line and dot keep
    // the true price — only the badge moves.
    const sorted = [...items].sort((a, b) => a.y - b.y);
    const badgeYs = dodgeBadgePositions(
      sorted.map((item) => item.y),
      { max: ctx.plot.bottom + 8 },
    );
    sorted.forEach((item, i) => {
      item.badgeY = badgeYs[i];
    });
    const joined = group
      .selectAll<SVGGElement, (typeof items)[number]>('g.d3-chart__reference')
      .data(items, (item) => item.key)
      .join((enter) => {
        const refGroup = enter.append('g').attr('class', 'd3-chart__reference');
        refGroup.append('line').attr('class', 'd3-chart__reference-line');
        // A dot marks the line's left end, so every dashed level reads as a
        // bulleted annotation even without a marker on the bar.
        refGroup.append('circle').attr('class', 'd3-chart__reference-dot');
        const badge = refGroup
          .append('g')
          .attr('class', 'd3-chart__reference-badge');
        badge.append('rect').attr('class', 'd3-chart__reference-badge-bg');
        badge.append('text').attr('class', 'd3-chart__reference-badge-text');
        return refGroup;
      });
    joined
      .select('line.d3-chart__reference-line')
      .attr('x1', ctx.plot.left)
      // The dashed line runs through the y-axis gutter and connects to the
      // badge.
      .attr('x2', ctx.plot.right + 46)
      .attr('y1', (item) => item.y)
      .attr('y2', (item) => item.y)
      .attr('stroke', (item) => item.color);
    joined
      .select('circle.d3-chart__reference-dot')
      .attr('cx', (item) => item.x)
      .attr('cy', (item) => item.y)
      .attr('r', 3.5)
      .attr('fill', (item) => item.color);
    joined
      .select('g.d3-chart__reference-badge')
      .attr(
        'transform',
        (item) => `translate(${ctx.plot.right + 46}, ${item.badgeY})`,
      );
    joined
      .select('rect.d3-chart__reference-badge-bg')
      .attr('x', 0)
      .attr('y', -10)
      .attr('width', (item) => item.text.length * 6 + 12)
      .attr('height', 16)
      .attr('fill', (item) => item.color)
      .attr('opacity', 0.9);
    joined
      .select('text.d3-chart__reference-badge-text')
      .attr('x', (item) => (item.text.length * 6 + 12) / 2)
      .attr('y', 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .text((item) => item.text);
  }

  // Buy/sell markers with labels.

  function drawMarkers(ctx: D3ChartRenderContext): void {
    const group = layerGroup(ctx, 'd3-chart__markers');
    if (!showMarkers.value) {
      group.selectAll('*').remove();
      return;
    }
    const lineYs = showReferenceLines.value
      ? rangedReferenceLines.value.map((level) => ctx.y(level.value))
      : [];
    const visible = stackMarkerLayouts(
      markerLayouts.value.filter(
        (layout) =>
          layout.index >= ctx.visibleFrom && layout.index < ctx.visibleTo,
      ),
    ).map((layout) => {
      const arrowY = ctx.y(layout.price) + layout.stackOffset;
      const hasText = Boolean(layout.text);
      return {
        layout,
        split: splitMarkerText(layout.text),
        // When a reference line cuts through the marker's text rows, step
        // the text further out; the arrows stay anchored to the bar price.
        textShift: hasText
          ? markerTextShift(arrowY, layout.textAbove, lineYs)
          : 0,
      };
    });
    const joined = group
      .selectAll<
        SVGGElement,
        {
          layout: MarkerLayout;
          split: SplitMarkerText;
          textShift: number;
        }
      >('g.d3-chart__marker')
      // The key is unique per stack slot: stacked markers share the bar
      // index, and duplicate join keys would collapse them back together.
      .data(
        visible,
        (datum) =>
          `${datum.layout.index}:${datum.layout.stackOffset}:${datum.layout.symbol}`,
      )
      .join((enter) => {
        const markerGroup = enter.append('g').attr('class', 'd3-chart__marker');
        // Paint order: the label text first (furthest back), the price in the
        // center, and the arrow last (on top, over the dashed level line).
        markerGroup
          .append('text')
          .attr('class', 'd3-chart__marker-label d3-chart__marker-word');
        markerGroup
          .append('text')
          .attr('class', 'd3-chart__marker-label d3-chart__marker-price');
        markerGroup.append('path').attr('class', 'd3-chart__marker-shape');
        return markerGroup;
      });
    joined.attr(
      'transform',
      (datum) =>
        `translate(${ctx.x(datum.layout.index)}, ${ctx.y(datum.layout.price) + datum.layout.stackOffset})`,
    );
    joined
      .select('path.d3-chart__marker-shape')
      .attr('d', (datum) => resolveMarkerSymbolPath(datum.layout.symbol))
      .attr('transform', (datum) => {
        const y = datum.layout.textAbove ? -6 : 0;
        const rotate =
          datum.layout.symbol === 'arrowDown' ? ' rotate(180)' : '';
        return `translate(0, ${y})${rotate}`;
      })
      .attr('fill', (datum) => datum.layout.color ?? '');
    // The marker is a three-row column with the arrow anchored to the bar:
    // below-bar markers read arrow, price, word (top to bottom); above-bar
    // markers are the mirror — word, price, arrow — so the arrow always sits
    // nearest the bar, pointing at it. Word-only labels (e.g. a dividend "D")
    // sit right beside the arrow.
    const priceY = (textAbove: boolean) => (textAbove ? -15 : 20);
    const wordY = (textAbove: boolean, hasPrice: boolean): number => {
      if (!hasPrice) return priceY(textAbove);
      return textAbove ? -30 : 36;
    };
    joined
      .select('text.d3-chart__marker-price')
      .attr('x', 0)
      .attr('y', (datum) => priceY(datum.layout.textAbove) + datum.textShift)
      .attr('text-anchor', 'middle')
      .attr('fill', (datum) => datum.layout.color ?? '')
      .text((datum) => datum.split.price ?? '');
    joined
      .select('text.d3-chart__marker-word')
      .attr('x', 0)
      .attr(
        'y',
        (datum) =>
          wordY(datum.layout.textAbove, Boolean(datum.split.price)) +
          datum.textShift,
      )
      .attr('text-anchor', 'middle')
      .attr('fill', (datum) => datum.layout.color ?? '')
      .text((datum) => datum.split.word ?? '');
  }

  // ---- Reactive wiring -------------------------------------------------------

  // A different price/volume style or heatmap variant rebuilds those layers.
  watch(
    [priceStyle, volumeStyle, heatmapVariant, showMarkers, showReferenceLines],
    () => {
      engine.renderAll();
    },
  );

  // Entering 1D shows the full intraday day; leaving is handled by the range
  // selection (onRange/onReset), which already set the active bar count.
  watch(
    () => options.intradayActive?.value,
    (active) => {
      if (!active) return;
      engine.activeBars.value = null;
      engine.fit();
    },
  );

  /** Fallback legend for charts without a quote (e.g. the list overview). */
  const legend = computed(() => {
    const last = options.history.value[options.history.value.length - 1];
    if (!last) return undefined;
    const currency = options.currency?.value;
    return currency !== undefined
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
        }).format(last.close)
      : last.close.toFixed(2);
  });

  /** Change label for the quote shown in the menu's left column. */
  const changeLabel = computed(() =>
    buildChangeLabel(options.quoteChange?.value, options.quoteChangeP?.value),
  );

  return {
    priceStyle,
    volumeStyle,
    heatmapVariant,
    showMarkers,
    showReferenceLines,
    showTooltip,
    tooltip,
    legend,
    changeLabel,
    rangeLabel,
    availableDays,
    /** The capped range the user selected (bars, or null for All). */
    selectedRangeBars: engine.activeBars,
    DEFAULT_RANGE_BARS,
    zoomIn: engine.zoomIn,
    zoomOut: engine.zoomOut,
    panBy: engine.panBy,
    fit: engine.fit,
    reset: engine.reset,
    setRange: engine.setRange,
  };
}
