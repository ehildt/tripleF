import { axisBottom, axisRight } from 'd3-axis';
import { type ScaleLinear, scaleLinear } from 'd3-scale';
import { pointer, select, type Selection } from 'd3-selection';
import {
  type D3ZoomEvent,
  zoom,
  type ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
  zoomTransform,
} from 'd3-zoom';
import { onBeforeUnmount, onMounted, type Ref, ref, watch } from 'vue';

import {
  type AxisDomains,
  buildAxisDomains,
} from '../helpers/build-axis-domain.helper';
import type { TimeTickLabel } from '../helpers/build-time-tick-formatter.helper';
import { buildTimeTickPlan } from '../helpers/build-time-tick-plan.helper';
import { buildZoomTransform } from '../helpers/build-zoom-transform.helper';
import { clampWindow } from '../helpers/clamp-window.helper';
import { computePlot, type D3ChartPlot } from '../helpers/compute-plot.helper';
import { computePlotBands } from '../helpers/compute-plot-bands.helper';
import type { IndexWindow } from '../helpers/compute-visible-window.helper';
import { computeVisibleWindow } from '../helpers/compute-visible-window.helper';
import { confineZoomTransform } from '../helpers/confine-zoom-transform.helper';
import { findNearestTimeIndex } from '../helpers/find-nearest-time-index.helper';
import { hasIntradayTimes } from '../helpers/has-intraday-times.helper';

/** Default visible range: the most recent quarter of trading days. */
export const DEFAULT_RANGE_BARS = 66;

/** The bars the chart knows about for domain/crosshair lookups. */
export interface D3ChartPointLike {
  time: string;
  high: number;
  low: number;
  volume: number;
}

/** Everything a leaf render pass needs to draw its series. */
export interface D3ChartRenderContext {
  svg: Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  plot: D3ChartPlot;
  /** Index scale with the current visible window as domain. */
  x: ScaleLinear<number, number>;
  /** Price scale over the visible bars. */
  y: ScaleLinear<number, number>;
  /** Volume scale (same range as `y` when the scales are not split). */
  yVolume: ScaleLinear<number, number>;
  /** First visible index (inclusive). */
  visibleFrom: number;
  /** Last visible index (exclusive). */
  visibleTo: number;
  /** The bar time at a fractional index, for axis and crosshair labels. */
  timeOfIndex: (index: number) => string | undefined;
  formatPrice: (price: number) => string;
  /** Re-render (after a leaf's internal state changed). */
  renderAll: () => void;
}

/** One crosshair position, emitted to tooltip subscribers. */
export interface D3CrosshairEvent {
  /** Pixel x of the snapped bar center. */
  x: number;
  /** Pixel y of the cursor. */
  y: number;
  index: number;
  time: string;
  price: number;
}

export interface UseD3ChartOptions {
  containerRef: Ref<HTMLDivElement | null>;
  /** Number of bars the range windowing is sized against. */
  getDataLength: () => number;
  /** Read a bar by index for domain/crosshair lookups. */
  getPoint: (index: number) => D3ChartPointLike | undefined;
  /** Price formatting for the right axis and crosshair label. */
  formatPrice: (price: number) => string;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  /** Reactive sources whose changes trigger re-render + re-windowing. */
  watchSources?: () => unknown[];
  /** Whether the y scale is split into price + volume bands. */
  volumeSplit: () => boolean;
  /** Pixel headroom above/below the price domain (marker labels). */
  markerHeadroomPx: () => number;
  /**
   * Prices of markers that must stay in view while panning (index + price
   * pairs). The engine expands the fitted y domain to include any visible
   * marker price, so markers never float above or below the plot.
   */
  getMarkerPrices?: () => Array<{ index: number; price: number }>;
  /**
   * Width of the right gutter (price labels + reference-line badges). The
   * leaf sizes it to fit its longest badge so badges never clip.
   */
  rightGutterWidth?: () => number;
  /** Whether the crosshair is drawn and its events emitted. */
  crosshair?: boolean;
  /**
   * Ref the engine updates with the current visible bar window (integer
   * `[from, to)` indices) on every render, so leaves can derive range-based
   * annotations (e.g. the ATH/ATL markers) from what is actually shown.
   */
  visibleWindowRef?: Ref<{ from: number; to: number }>;
  /** Draw the leaf's layers. */
  render: (ctx: D3ChartRenderContext) => void;
}

/**
 * Owns the lifecycle, scales, axes, zoom/pan, crosshair, and range windowing
 * shared by every D3 chart in the stockmarket template: mounting the SVG with
 * the common design, tracking the user's visible window, re-windowing on data
 * changes, and teardown. The leaf only supplies how its layers are drawn.
 *
 * The x axis is a linear index scale (like lightweight-charts' logical
 * range), so every bar gets a fixed pixel slot; the zoom transform maps the
 * visible index window, and tick labels resolve the time of each tick's
 * nearest bar.
 */
export function useD3Chart(options: UseD3ChartOptions) {
  const {
    containerRef,
    getDataLength,
    getPoint,
    formatPrice,
    onRangeRequest,
    watchSources,
    volumeSplit,
    markerHeadroomPx,
    getMarkerPrices,
    rightGutterWidth,
    crosshair = false,
    render,
  } = options;

  const svgRef = ref<SVGSVGElement | null>(null);

  /**
   * The range the user picked (null = fit everything). Tracked because data
   * updates (streaming, paginated backfills) must NOT snap the view back to
   * the default window.
   */
  const activeBars = ref<number | null>(DEFAULT_RANGE_BARS);

  let overlayNode: SVGRectElement | null = null;
  let zoomBehavior: ZoomBehavior<SVGRectElement, unknown> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let xScale: ScaleLinear<number, number> | null = null;
  let yScale: ScaleLinear<number, number> | null = null;
  let currentPlot: D3ChartPlot = { left: 0, top: 0, right: 0, bottom: 0 };
  const crosshairListeners = new Set<(e: D3CrosshairEvent | null) => void>();
  let lastCrosshair: { x: number; y: number; price: number } | null = null;

  /**
   * The y-domains last fitted to a committed view (mount, range change, data
   * change, style change, zoom). Reused as-is during pans so dragging the
   * canvas moves the view without re-fitting the price scale and reshaping
   * the series.
   */
  let fittedDomains: AxisDomains | null = null;
  /** Re-fit the y scale on the next render. */
  let refitY = true;
  /** The last zoom scale factor, to tell pans (k constant) from zooms. */
  let lastZoomK = 1;
  /** The last volume-split state, to re-fit when the volume style changes. */
  let lastVolumeSplit = false;
  /** The data length of the last render, to detect appended data. */
  let lastDataLength = 0;

  function emitCrosshair(event: D3CrosshairEvent | null): void {
    for (const listener of crosshairListeners) listener(event);
  }

  function onCrosshair(
    listener: (event: D3CrosshairEvent | null) => void,
  ): () => void {
    crosshairListeners.add(listener);
    return () => crosshairListeners.delete(listener);
  }

  function timeOfIndex(index: number): string | undefined {
    return getPoint(index)?.time;
  }

  function getVisibleWindow(): IndexWindow {
    if (!xScale) return { from: 0, to: 0 };
    const domain = xScale.domain();
    return { from: domain[0], to: domain[1] };
  }

  /**
   * The container's content-box size. The svg's `height: 100%` resolves
   * against the content box, so measuring `clientWidth/Height` (which include
   * padding) would leave the coordinate system taller than the render and
   * clip the bottom axis labels.
   */
  function containerSize(container: HTMLElement): {
    width: number;
    height: number;
  } {
    const style = getComputedStyle(container);
    return {
      width:
        container.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight),
      height:
        container.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom),
    };
  }

  function handleZoom(event?: D3ZoomEvent<SVGRectElement, unknown>): void {
    const confined = confineStoredZoom();
    if (!confined) return;
    const { transform: t, rebuilt } = confined;
    // A pan keeps the zoom scale factor constant; a zoom (wheel, buttons, or
    // a range selection) changes it. Only zooms re-fit the y scale — pans
    // reuse the fitted domains so the series keeps its shape while dragging.
    // The confinement rebuild recomputes k with float drift, so the
    // comparison needs a tolerance; a rebuilt window (a pan clamped at the
    // range edge) refits too, since its bars no longer match the fitted domain.
    const kChanged =
      Math.abs(t.k - lastZoomK) > 1e-9 * Math.max(t.k, lastZoomK, 1);
    if (kChanged || rebuilt) refitY = true;
    if (kChanged) {
      // d3 folds a vertical offset into transform.y whenever it scales about
      // a point (wheel, +/-, dblclick). The engine reads transform.y as a
      // deliberate vertical price pan, so zoom gestures would otherwise
      // accumulate a phantom pan that grows with the visible price span and
      // eventually pushes the whole series (and the heatmap) off the plot.
      // Strip it on every zoom; only real pans (k constant) move y.
      // Two-finger pinches pan and zoom at once, so touch gestures keep y.
      if (
        t.y !== 0 &&
        event?.sourceEvent?.type !== 'touchmove' &&
        overlayNode
      ) {
        (overlayNode as unknown as { __zoom: ZoomTransform }).__zoom =
          new ZoomTransform(t.k, t.x, 0);
      }
    }
    lastZoomK = t.k;
    renderAll();
  }

  /**
   * Snap the raw zoom transform into the territory the user is allowed to
   * see (the selected range: [`rangeFrom`, n]) and store it back on the
   * element. The stored transform is always the confined one, so every
   * gesture (drag, wheel, pinch, buttons) continues from the enforced view.
   * `rebuilt` tells the caller the window was clamped (and rebuilt), so
   * float-drifted k on identity transforms never masquerades as a zoom.
   */
  function confineStoredZoom(): {
    transform: ZoomTransform;
    rebuilt: boolean;
  } | null {
    const container = containerRef.value;
    if (!overlayNode || !container) return null;
    const { width, height } = containerSize(container);
    if (width === 0 || height === 0) return null;
    const n = getDataLength();
    const plot = computePlot(width, height, rightGutterWidth?.());
    if (plot.right <= plot.left || plot.bottom <= plot.top) return null;
    const xBase = scaleLinear().domain([0, n]).range([plot.left, plot.right]);
    const rangeFrom =
      activeBars.value === null ? 0 : Math.max(0, n - activeBars.value);
    const raw = zoomTransform(overlayNode);
    const confined = confineZoomTransform(raw, plot, xBase, n, rangeFrom);
    if (confined !== raw) {
      // Direct assignment: `zoomBehavior.transform` would emit a zoom event
      // and re-enter this path.
      (overlayNode as unknown as { __zoom: ZoomTransform }).__zoom = confined;
    }
    return { transform: confined, rebuilt: confined !== raw };
  }

  function drawGridAndAxes(
    plot: D3ChartPlot,
    x: ScaleLinear<number, number>,
    y: ScaleLinear<number, number>,
  ): void {
    const svg = select(svgRef.value as SVGSVGElement);
    const grid = svg.select<SVGGElement>('g.d3-chart__grid');

    // Horizontal grid lines at the price ticks.
    const priceTicks = y.ticks(6);
    grid
      .selectAll<SVGLineElement, number>('line.d3-chart__hgrid')
      .data(priceTicks)
      .join('line')
      .attr('class', 'd3-chart__hgrid')
      .attr('x1', plot.left)
      .attr('x2', plot.right)
      .attr('y1', (v) => y(v))
      .attr('y2', (v) => y(v));

    const priceAxis = axisRight<number>(y)
      .tickValues(priceTicks)
      .tickSize(0)
      .tickFormat((v) => formatPrice(v));
    svg
      .select<SVGGElement>('g.d3-chart__axis--price')
      .attr('transform', `translate(${plot.right}, 0)`)
      .call(priceAxis);

    // Time ticks: the interval adapts to the visible time span (months,
    // weeks, days, then hours and 30/15/5-minute buckets), mapped to the
    // nearest bar. Edge ticks whose labels would clip at the plot's left
    // edge are dropped.
    const [windowFrom, windowTo] = x.domain();
    const visibleFrom = Math.max(0, Math.floor(windowFrom));
    const visibleTo = Math.min(getDataLength(), Math.ceil(windowTo));
    const firstVisibleTime = timeOfIndex(visibleFrom);
    const lastVisibleTime = timeOfIndex(visibleTo - 1);
    const plan =
      firstVisibleTime && lastVisibleTime
        ? buildTimeTickPlan(
            firstVisibleTime,
            lastVisibleTime,
            plot.right - plot.left,
            hasIntradayTimes(timeOfIndex, visibleFrom, visibleTo),
          )
        : [];
    const tickLabels = new Map<number, TimeTickLabel>();
    const xTicks: number[] = [];
    for (const tick of plan) {
      const index = findNearestTimeIndex(
        timeOfIndex,
        getDataLength(),
        tick.time,
      );
      if (index === undefined) continue;
      const labelWidth = tick.text.length * 6.5;
      if (x(index) - labelWidth / 2 < plot.left) continue;
      xTicks.push(index);
      tickLabels.set(index, { text: tick.text, isMajor: tick.isMajor });
    }
    const timeAxis = axisBottom<number>(x)
      .tickValues(xTicks)
      .tickSize(0)
      .tickFormat((index) => tickLabels.get(index)?.text ?? '');
    svg
      .select<SVGGElement>('g.d3-chart__axis--time')
      .attr('transform', `translate(0, ${plot.bottom})`)
      .call(timeAxis);

    // Vertical grid lines at the time ticks: major (month/date) lines keep
    // the strong style, minor (day) lines render muted.
    grid
      .selectAll<SVGLineElement, number>('line.d3-chart__vgrid')
      .data(xTicks)
      .join('line')
      .attr('class', (tick) =>
        tickLabels.get(tick)?.isMajor
          ? 'd3-chart__vgrid d3-chart__vgrid--major'
          : 'd3-chart__vgrid d3-chart__vgrid--day',
      )
      .attr('x1', (tick) => x(tick))
      .attr('x2', (tick) => x(tick))
      .attr('y1', plot.top)
      .attr('y2', plot.bottom);
  }

  /**
   * Expand a price domain to include any visible marker price (with a small
   * margin so the marker label never clips), so markers never float above or
   * below the plot — during pans and after zooms alike.
   */
  function expandDomainsForMarkers(
    domains: AxisDomains,
    markers: Array<{ index: number; price: number }>,
    visibleFrom: number,
    visibleTo: number,
  ): AxisDomains {
    const span = domains.price[1] - domains.price[0];
    const margin = span * 0.05;
    let result = domains;
    for (const marker of markers) {
      if (marker.index < visibleFrom || marker.index >= visibleTo) continue;
      if (marker.price < result.price[0]) {
        result = {
          ...result,
          price: [marker.price - margin, result.price[1]],
        };
      } else if (marker.price > result.price[1]) {
        result = {
          ...result,
          price: [result.price[0], marker.price + margin],
        };
      }
    }
    return result;
  }

  function renderAll(): void {
    const container = containerRef.value;
    const svgNode = svgRef.value;
    if (!container || !svgNode || !overlayNode || !zoomBehavior) return;

    const { width, height } = containerSize(container);
    if (width === 0 || height === 0) return;

    const n = getDataLength();
    currentPlot = computePlot(width, height, rightGutterWidth?.());
    const plot = currentPlot;
    if (plot.right <= plot.left || plot.bottom <= plot.top) return;

    select(svgNode).attr('width', width).attr('height', height);
    // The event overlay must cover the whole canvas for pointer capture.
    select(overlayNode).attr('width', width).attr('height', height);

    const xBase = scaleLinear().domain([0, n]).range([plot.left, plot.right]);
    const bands = computePlotBands(plot.top, plot.bottom, volumeSplit());
    const priceBandHeight = Math.max(1, bands.price.bottom - bands.price.top);
    // Zoom-out is capped by the range confinement (the window can never grow
    // past it); zoom-in may go down to a couple of bars. There is no d3
    // translate extent: the confined-transform invariant is the only pan
    // constraint (see handleZoom).
    zoomBehavior.scaleExtent([0.01, Math.max(1, n / 2)]);
    zoomBehavior.extent([
      [0, 0],
      [width, height],
    ]);

    // The stored transform is always confined to the selected range, so the
    // visible window is a plain projection of it.
    const t = zoomTransform(overlayNode);
    const domain = t.rescaleX(xBase).domain();
    const window = { from: domain[0], to: domain[1] };
    lastDataLength = n;
    xScale = xBase.copy().domain([window.from, window.to]);

    const visibleFrom = Math.max(0, Math.floor(window.from));
    const visibleTo = Math.min(n, Math.ceil(window.to));
    if (options.visibleWindowRef) {
      options.visibleWindowRef.value = { from: visibleFrom, to: visibleTo };
    }
    const points: D3ChartPointLike[] = [];
    for (let i = visibleFrom; i < visibleTo; i++) {
      const point = getPoint(i);
      if (point) points.push(point);
    }

    const split = volumeSplit();
    if (split !== lastVolumeSplit) refitY = true;
    lastVolumeSplit = split;

    // Fit the y domains to the visible bars only on committed view changes
    // (mount, range/data/style changes, zooms). During a pan the fitted
    // domains are reused unchanged, so the series keeps its shape while the
    // view moves.
    let domains: AxisDomains;
    if (refitY) {
      const rawDomains = buildAxisDomains(points, 0, split);
      const headroom =
        (markerHeadroomPx() / priceBandHeight) *
        (rawDomains.price[1] - rawDomains.price[0]);
      domains = buildAxisDomains(points, headroom, split);
      // Keep pinned (selected-range) markers in view even when zoomed in:
      // expand the freshly fitted price domain to include any marker price
      // that falls outside it, so the extreme bullets never float off-plot.
      domains = expandDomainsForMarkers(
        domains,
        getMarkerPrices?.() ?? [],
        visibleFrom,
        visibleTo,
      );
      fittedDomains = domains;
      refitY = false;
    } else {
      domains = fittedDomains ?? buildAxisDomains(points, 0, split);
      // Keep visible markers in view: expand the frozen price domain to
      // include any marker price that falls outside it (with a small margin
      // so the marker label never clips), so markers never float above or
      // below the plot while panning.
      domains = expandDomainsForMarkers(
        domains,
        getMarkerPrices?.() ?? [],
        visibleFrom,
        visibleTo,
      );
    }

    // The transform's y pans the fitted price domain (vertical drag): the
    // domain shifts in price space, so the series keeps its shape and just
    // moves up/down. The domain can't go below zero.
    const priceSpan = domains.price[1] - domains.price[0];
    // Bound the vertical pan to under one pane (10% of the data always stays
    // in view, so a hard drag can never push the series off the plot). The
    // zero floor still keeps the domain bottom at zero when prices are low.
    const maxPriceShift = priceSpan * 0.9;
    const yShift = Math.min(
      maxPriceShift,
      Math.max(
        Math.max(0 - domains.price[0], -maxPriceShift),
        (t.y / priceBandHeight) * priceSpan,
      ),
    );
    yScale = scaleLinear()
      .domain([domains.price[0] + yShift, domains.price[1] + yShift])
      .range([bands.price.bottom, bands.price.top]);
    const yVolume = bands.volume
      ? scaleLinear()
          .domain(domains.volume as [number, number])
          .range([bands.volume.bottom, bands.volume.top])
      : yScale;

    drawGridAndAxes(plot, xScale, yScale);

    const ctx: D3ChartRenderContext = {
      svg: select(svgNode),
      width,
      height,
      plot,
      x: xScale,
      y: yScale,
      yVolume,
      visibleFrom,
      visibleTo,
      timeOfIndex,
      formatPrice,
      renderAll,
    };
    render(ctx);
    if (crosshair) redrawCrosshair();
  }

  function buildChart(): void {
    const container = containerRef.value;
    if (!container) return;

    const svg = select(container)
      .append<SVGSVGElement>('svg')
      .attr('class', 'd3-chart')
      .attr('width', 0)
      .attr('height', 0);
    svgRef.value = svg.node() as SVGSVGElement;
    // The wheel over the chart must never scroll the surrounding page:
    // d3-zoom already prevents the default while it processes the wheel, but
    // at the scale-extent boundary it bails out early, so this listener is the
    // safety net that keeps the chat scrollbar still while zooming.
    svg.on(
      'wheel.d3-chart',
      (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false },
    );
    svg.append('g').attr('class', 'd3-chart__grid');
    svg.append('g').attr('class', 'd3-chart__axis d3-chart__axis--price');
    svg.append('g').attr('class', 'd3-chart__axis d3-chart__axis--time');
    svg.append('g').attr('class', 'd3-chart__layers');
    const crosshairGroup = svg
      .append('g')
      .attr('class', 'd3-chart__crosshair')
      .style('display', 'none');
    crosshairGroup
      .append('line')
      .attr('class', 'd3-chart__crosshair-line d3-chart__crosshair-vline');
    crosshairGroup
      .append('line')
      .attr('class', 'd3-chart__crosshair-line d3-chart__crosshair-hline');
    const priceLabel = crosshairGroup
      .append('g')
      .attr(
        'class',
        'd3-chart__crosshair-label d3-chart__crosshair-label--price',
      );
    priceLabel.append('rect').attr('class', 'd3-chart__crosshair-label-bg');
    priceLabel.append('text').attr('class', 'd3-chart__crosshair-label-text');

    overlayNode = svg
      .append<SVGRectElement>('rect')
      .attr('class', 'd3-chart__overlay')
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .style('cursor', 'crosshair')
      .node() as SVGRectElement;

    zoomBehavior = zoom<SVGRectElement, unknown>().on('zoom', handleZoom);
    select(overlayNode).call(zoomBehavior);
    if (crosshair) {
      select(overlayNode)
        .on('pointermove.d3-chart', handlePointerMove)
        .on('pointerleave.d3-chart', handlePointerLeave);
    }

    // Re-render when the container resizes so the svg coordinate system
    // always matches the rendered size (otherwise axis labels clip).
    resizeObserver = new ResizeObserver(() => handleZoom());
    resizeObserver.observe(container);

    renderAll();
    applyActiveRange();
  }

  function destroyChart(): void {
    crosshairListeners.clear();
    resizeObserver?.disconnect();
    resizeObserver = null;
    svgRef.value?.remove();
    svgRef.value = null;
    overlayNode = null;
    zoomBehavior = null;
    xScale = null;
    yScale = null;
  }

  onMounted(buildChart);
  onBeforeUnmount(destroyChart);

  if (watchSources) {
    watch(
      watchSources,
      () => {
        if (!svgRef.value) return;
        keepCurrentWindow();
      },
      { deep: true },
    );
  }

  /**
   * Data or annotations changed: re-fit the y scale and keep the user's
   * current view (clamped into the territory) instead of snapping to the
   * selected range end — unless the view sits at the latest bar, in which
   * case it follows the newest data as it streams in.
   */
  function keepCurrentWindow(): void {
    refitY = true;
    const windowBefore = xScale ? xScale.domain() : null;
    const atLatestEdge =
      lastDataLength > 0 &&
      windowBefore !== null &&
      windowBefore[1] >= lastDataLength - 1e-6;
    if (atLatestEdge || !windowBefore) {
      applyActiveRange();
      return;
    }
    const container = containerRef.value;
    if (!overlayNode || !zoomBehavior || !container) return;
    const { width, height } = containerSize(container);
    if (width === 0 || height === 0) return;
    const n = getDataLength();
    const plot = computePlot(width, height, rightGutterWidth?.());
    if (plot.right <= plot.left || plot.bottom <= plot.top) return;
    const rangeFrom =
      activeBars.value === null ? 0 : Math.max(0, n - activeBars.value);
    const xBase = scaleLinear().domain([0, n]).range([plot.left, plot.right]);
    const window = clampWindow(
      { from: windowBefore[0], to: windowBefore[1] },
      n,
      rangeFrom,
      n,
    );
    const transform = buildZoomTransform(plot.left, plot.right, xBase, window);
    // The transform's vertical pan position does NOT carry over: the y scale
    // refits to the new window (refitY), so a stale pixel offset would map
    // to a price shift sized by the new span — pushing the series off-plot.
    select(overlayNode).call(zoomBehavior.transform, transform);
  }

  function applyActiveRange(): void {
    refitY = true;
    if (!overlayNode || !zoomBehavior) return;
    const n = getDataLength();
    const window = computeVisibleWindow(n, activeBars.value);
    const container = containerRef.value;
    const { width, height } = container
      ? containerSize(container)
      : { width: 0, height: 0 };
    const plot = computePlot(width, height, rightGutterWidth?.());
    if (plot.right <= plot.left || plot.bottom <= plot.top) return;
    const xBase = scaleLinear().domain([0, n]).range([plot.left, plot.right]);
    const transform = buildZoomTransform(plot.left, plot.right, xBase, window);
    select(overlayNode).call(zoomBehavior.transform, transform);
  }

  /** Zoom toward the center of the visible window. */
  function zoomBy(factor: number): void {
    if (!overlayNode || !zoomBehavior) return;
    const container = containerRef.value;
    const { width, height } = container
      ? containerSize(container)
      : { width: 0, height: 0 };
    const plot = computePlot(width, height, rightGutterWidth?.());
    if (plot.right <= plot.left || plot.bottom <= plot.top) return;
    const centerX = (plot.left + plot.right) / 2;
    const centerY = (plot.top + plot.bottom) / 2;
    select(overlayNode).call(zoomBehavior.scaleBy, factor, [centerX, centerY]);
  }

  function zoomIn(): void {
    zoomBy(1.5);
  }

  function zoomOut(): void {
    zoomBy(0.66);
  }

  /** Pan the view by a pixel delta (a programmatic drag, e.g. arrow keys). */
  function panBy(dx: number, dy: number): void {
    if (!overlayNode || !zoomBehavior) return;
    select(overlayNode).call(zoomBehavior.translateBy, dx, dy);
  }

  /** Fit the full series into view. */
  function fit(): void {
    refitY = true;
    if (!overlayNode || !zoomBehavior) return;
    select(overlayNode).call(zoomBehavior.transform, zoomIdentity);
  }

  async function reset(): Promise<void> {
    activeBars.value = null;
    await onRangeRequest?.(null);
    applyActiveRange();
  }

  async function setRange(bars: number): Promise<void> {
    activeBars.value = bars;
    await onRangeRequest?.(bars);
    applyActiveRange();
  }

  // ---- Crosshair -----------------------------------------------------------

  function handlePointerMove(event: PointerEvent): void {
    if (!overlayNode || !xScale || !yScale) return;
    const n = getDataLength();
    if (n === 0) return;
    const [px, py] = pointer(event, overlayNode);
    const index = Math.min(n - 1, Math.max(0, Math.round(xScale.invert(px))));
    const point = getPoint(index);
    if (!point) return;
    const x = xScale(index);
    const price = yScale.invert(py);
    lastCrosshair = { x, y: py, price };
    drawCrosshairAt(x, py, price);
    emitCrosshair({ x, y: py, index, time: point.time, price });
  }

  function handlePointerLeave(): void {
    lastCrosshair = null;
    hideCrosshair();
    emitCrosshair(null);
  }

  function redrawCrosshair(): void {
    if (!lastCrosshair || !xScale || !yScale) return;
    const index = Math.round(xScale.invert(lastCrosshair.x));
    const x = xScale(index);
    drawCrosshairAt(x, lastCrosshair.y, lastCrosshair.price);
  }

  function drawCrosshairAt(x: number, y: number, price: number): void {
    const svg = select(svgRef.value as SVGSVGElement);
    const plot = currentPlot;
    const crosshair = svg
      .select<SVGGElement>('g.d3-chart__crosshair')
      .style('display', null);

    crosshair
      .select('.d3-chart__crosshair-vline')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', plot.top)
      .attr('y2', plot.bottom);
    crosshair
      .select('.d3-chart__crosshair-hline')
      .attr('x1', plot.left)
      .attr('x2', plot.right)
      .attr('y1', y)
      .attr('y2', y);

    const priceText = formatPrice(price);
    const priceWidth = priceText.length * 6.5 + 12;
    const priceY = Math.min(
      Math.max(y - 10, plot.top),
      Math.max(plot.top, plot.bottom - 18),
    );
    const priceLabel = crosshair.select('.d3-chart__crosshair-label--price');
    priceLabel.attr('transform', `translate(${plot.right}, ${plot.top})`);
    priceLabel
      .select('rect')
      .attr('y', priceY)
      .attr('width', priceWidth)
      .attr('height', 18);
    priceLabel
      .select('text')
      .attr('x', priceWidth / 2)
      .attr('y', priceY + 13)
      .text(priceText);
  }

  function hideCrosshair(): void {
    const svg = svgRef.value;
    if (!svg) return;
    select(svg)
      .select<SVGGElement>('g.d3-chart__crosshair')
      .style('display', 'none');
  }

  return {
    activeBars,
    getVisibleWindow,
    onCrosshair,
    renderAll,
    applyActiveRange,
    zoomIn,
    zoomOut,
    panBy,
    fit,
    reset,
    setRange,
  };
}
