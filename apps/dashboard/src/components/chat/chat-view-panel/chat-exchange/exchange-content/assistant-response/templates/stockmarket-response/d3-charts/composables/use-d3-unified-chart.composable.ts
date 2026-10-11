import { computed, ref, watch } from 'vue';

import { buildChangeLabel } from '../../helpers/build-change-label.helper';
import type { ChartTooltipRow } from '../../shared/chart-tooltip/ChartTooltip.types';
import type {
  D3HeatmapVariant,
  D3PriceStyle,
  D3VolumeStyle,
} from '../D3Chart.types';
import { buildHeatmapCells } from '../helpers/build-heatmap-cells.helper';
import type { HeatmapDayCells } from '../helpers/build-heatmap-cells.helper.types';
import {
  buildMarkerLayouts,
  type MarkerLayout,
} from '../helpers/build-marker-layout.helper';
import { buildPivotMarkers } from '../helpers/build-pivot-markers.helper';
import { buildPriceFormatter } from '../helpers/build-price-formatter.helper';
import { buildRangeLabel } from '../helpers/build-range-label.helper';
import { computeFlowColumns } from '../helpers/compute-flow-columns.helper';
import type { FlowColumn } from '../helpers/compute-flow-columns.helper.types';
import { computeSimpleMovingAverage } from '../helpers/compute-simple-moving-average.helper';
import { countChartCalendarDays } from '../helpers/count-chart-calendar-days.helper';
import { dedupeReferenceLines } from '../helpers/dedupe-reference-lines.helper';
import { ensureExtremeReferenceLines } from '../helpers/ensure-extreme-reference-lines.helper';
import { filterReferenceLinesInRange } from '../helpers/filter-reference-lines-in-range.helper';
import { filterReferenceLinesInWindow } from '../helpers/filter-reference-lines-in-window.helper';
import { forceExtremeMarkers } from '../helpers/force-extreme-markers.helper';
import { formatRgba } from '../helpers/format-rgba.helper';
import { formatVolume } from '../helpers/format-volume.helper';
import { greenColor } from '../helpers/green-color.helper';
import { hasIntradayTimes } from '../helpers/has-intraday-times.helper';
import { isExtremeAnnotation } from '../helpers/is-extreme-annotation.helper';
import { isMovingAverageReferenceLine } from '../helpers/is-moving-average-reference-line.helper';
import { mapMarkerLayoutToPrice } from '../helpers/map-marker-layout-to-price.helper';
import { mapMarkerToLayout } from '../helpers/map-marker-to-layout.helper';
import { mergeDuplicateReferenceLines } from '../helpers/merge-duplicate-reference-lines.helper';
import { mergeMarkerLayouts } from '../helpers/merge-marker-layouts.helper';
import { pinMarkerLayoutsToWindow } from '../helpers/pin-marker-layouts-to-window.helper';
import { purpleColor } from '../helpers/purple-color.helper';
import { resolveColor } from '../helpers/resolve-color.helper';
import { resolveTokenColor } from '../helpers/resolve-token-color.helper';
import type { RgbaColor } from '../helpers/rgba-color.model';
import { turboColor } from '../helpers/turbo-color.helper';
import { CHART_LAYER_CLASSES } from '../layers/chart-layer-classes.constant';
import { clearLayerGroups } from '../layers/clear-layer-groups.layer';
import { drawCandles } from '../layers/draw-candles.layer';
import { drawHeatmapCells } from '../layers/draw-heatmap-cells.layer';
import { drawHeatmapFlow } from '../layers/draw-heatmap-flow.layer';
import { drawHlcArea } from '../layers/draw-hlc-area.layer';
import { drawChartMarkers } from '../layers/draw-markers.layer';
import { drawMovingAverage } from '../layers/draw-moving-average.layer';
import { drawPriceLine } from '../layers/draw-price-line.layer';
import { drawReferenceLines } from '../layers/draw-reference-lines.layer';
import { drawVolumeHistogram } from '../layers/draw-volume-histogram.layer';
import {
  CHART_BAND_COUNT,
  CHART_MA_LENGTH,
  CHART_MARKER_TEXT_MARGIN,
} from './unified-chart-tuning.constant';
import { useD3Chart } from './use-d3-chart.composable';
import type {
  D3ChartRenderContext,
  D3CrosshairEvent,
} from './use-d3-chart.composable.types';
import { useD3ChartTooltip } from './use-d3-chart-tooltip.composable';
import type { UseD3UnifiedChartOptions } from './use-d3-unified-chart.composable.types';

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

/**
 * Owns the state and rendering of the unified stock chart on the D3 engine:
 * the price/volume style switches, the heatmap data and flow geometry, the
 * moving average, the reference-line badges, the buy/sell markers, the
 * crosshair tooltip, and the legend/change labels for the menu bar. The
 * per-layer drawing lives in `../layers/`; this composable keeps the state,
 * the derivations, and the style dispatch.
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
      CHART_BAND_COUNT,
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
      CHART_MA_LENGTH,
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
    markerHeadroomPx: () => (showMarkers.value ? CHART_MARKER_TEXT_MARGIN : 0),
    getMarkerPrices: () => markerLayouts.value.map(mapMarkerLayoutToPrice),
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
  const availableDays = computed(() =>
    countChartCalendarDays(
      options.availableRange?.value,
      options.history.value,
    ),
  );

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
            explicit.map((marker) =>
              mapMarkerToLayout(marker, resolveTokenColor),
            ),
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
    return pinMarkerLayoutsToWindow(
      extremes,
      visibleWindow.value.from,
      visibleWindow.value.to,
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

  // ---- Tooltip -------------------------------------------------------------

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

  // ---- Rendering (style dispatch; the drawing lives in ../layers/) ---------

  /** Track the style a layer group was last drawn with, to clear it on change. */
  let lastPriceStyle: D3PriceStyle | null = null;
  let lastVolumeStyle: D3VolumeStyle | null = null;
  let lastHeatmapVariant: D3HeatmapVariant | null = null;

  function renderChart(ctx: D3ChartRenderContext): void {
    drawPriceLayers(ctx);
    drawVolumeLayers(ctx);
    drawMovingAverage(ctx, options.history.value, movingAverage.value);

    if (!showReferenceLines.value) {
      clearLayerGroups(ctx, CHART_LAYER_CLASSES.referenceLines);
    } else {
      drawReferenceLines(
        ctx,
        options.history.value,
        rangedReferenceLines.value,
      );
    }

    if (!showMarkers.value) {
      clearLayerGroups(ctx, CHART_LAYER_CLASSES.markers);
      return;
    }
    const lineYs = showReferenceLines.value
      ? rangedReferenceLines.value.map((level) => ctx.y(level.value))
      : [];
    drawChartMarkers(ctx, markerLayouts.value, lineYs);
  }

  /** Price series dispatch: clear the stale style's group on a switch, then
   *  draw candles / line / HLC area. */
  function drawPriceLayers(ctx: D3ChartRenderContext): void {
    if (lastPriceStyle !== priceStyle.value) {
      if (lastPriceStyle !== null) {
        clearLayerGroups(
          ctx,
          CHART_LAYER_CLASSES.candles,
          CHART_LAYER_CLASSES.line,
          CHART_LAYER_CLASSES.hlc,
        );
      }
      lastPriceStyle = priceStyle.value;
    }
    if (priceStyle.value === 'candles') drawCandles(ctx, options.history.value);
    else if (priceStyle.value === 'line')
      drawPriceLine(ctx, options.history.value);
    else drawHlcArea(ctx, options.history.value);
  }

  /** Volume series dispatch: clear the stale style/variant groups on a
   *  switch, then draw histogram or heatmap (cells / flow). */
  function drawVolumeLayers(ctx: D3ChartRenderContext): void {
    if (lastVolumeStyle !== volumeStyle.value) {
      if (lastVolumeStyle !== null) {
        clearLayerGroups(
          ctx,
          CHART_LAYER_CLASSES.volume,
          CHART_LAYER_CLASSES.heatmap,
          CHART_LAYER_CLASSES.flow,
        );
      }
      lastVolumeStyle = volumeStyle.value;
      lastHeatmapVariant = null;
    }
    if (
      volumeStyle.value === 'heatmap' &&
      lastHeatmapVariant !== heatmapVariant.value
    ) {
      clearLayerGroups(
        ctx,
        CHART_LAYER_CLASSES.heatmap,
        CHART_LAYER_CLASSES.flow,
      );
      lastHeatmapVariant = heatmapVariant.value;
    }
    if (volumeStyle.value === 'histogram')
      drawVolumeHistogram(ctx, options.history.value);
    else if (heatmapVariant.value === 'cells')
      drawHeatmapCells(ctx, heatmapData.value, cellShader);
    else drawHeatmapFlow(ctx, flowColumns.value, cellShader);
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
    /** The chart engine: the range controls bind its zoom/pan/range actions
     *  and the selected range (`engine.activeBars`) directly, rather than
     *  this composable re-exporting each member. */
    engine,
  };
}
