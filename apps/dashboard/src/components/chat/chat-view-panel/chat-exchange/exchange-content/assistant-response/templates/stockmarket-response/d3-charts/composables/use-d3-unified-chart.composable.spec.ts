import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';

import type { D3ChartPoint } from '../D3Chart.types';
import { useD3UnifiedChart } from './use-d3-unified-chart.composable';

function makePoints(count: number, base = 200): D3ChartPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const close = base + Math.sin(i / 3) * 12 + i * 0.4;
    const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    return {
      time: day,
      open: close - 2,
      high: close + 3,
      low: close - 3,
      close,
      volume: 1000 + (i % 7) * 250,
    };
  });
}

function overlayTransform(container: HTMLElement): {
  k: number;
  x: number;
  y: number;
} {
  const overlay = container.querySelector('rect.d3-chart__overlay');
  const transform = (
    overlay as unknown as { __zoom: { k: number; x: number; y: number } }
  ).__zoom;
  return transform;
}

interface HarnessOverrides {
  history?: D3ChartPoint[];
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  quotePrice?: number;
  quoteChange?: number;
  quoteChangeP?: number;
  markers?: import('../D3Chart.types').D3ChartMarker[];
  referenceLines?: import('../D3Chart.types').D3ReferenceLine[];
}

function mountHarness(overrides: HarnessOverrides = {}) {
  const history = ref<D3ChartPoint[]>(overrides.history ?? makePoints(100));
  const onRangeRequest = overrides.onRangeRequest ?? vi.fn();

  // The container exists with a real layout before the chart mounts, so the
  // initial render pass sees a non-degenerate plot.
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(container, 'clientHeight', {
    value: 320,
    configurable: true,
  });
  const containerRef = ref<HTMLDivElement | null>(container);
  const tooltipRef = ref<{ rootEl: HTMLElement | null } | null>(null);

  const Harness = defineComponent({
    setup() {
      const api = useD3UnifiedChart({
        containerRef,
        tooltipRef,
        history,
        markers: ref(overrides.markers),
        referenceLines: ref(overrides.referenceLines),
        onRangeRequest,
        quotePrice: ref(overrides.quotePrice),
        quoteChange: ref(overrides.quoteChange),
        quoteChangeP: ref(overrides.quoteChangeP),
        t: (key) => key,
      });
      return { api };
    },
    template: '<div />',
  });

  const wrapper = mount(Harness);
  return {
    wrapper,
    api: wrapper.vm.api,
    history,
    onRangeRequest,
    container,
  };
}

describe('useD3UnifiedChart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('mounts an svg in the container', () => {
    const { container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
  });

  it('defaults to candles, heatmap flow, and all annotations on', () => {
    const { api } = mountHarness();
    expect(api.priceStyle.value).toBe('candles');
    expect(api.volumeStyle.value).toBe('heatmap');
    expect(api.heatmapVariant.value).toBe('flow');
    expect(api.showMarkers.value).toBe(true);
    expect(api.showReferenceLines.value).toBe(true);
    expect(api.showTooltip.value).toBe(true);
  });

  it('switching the price style re-renders the matching layer', async () => {
    const { api, container } = mountHarness();
    api.priceStyle.value = 'line';
    await nextTick();
    expect(container.querySelector('g.d3-chart__line path')).not.toBeNull();
  });

  it('switching the volume style to histogram renders volume bars', async () => {
    const { api, container } = mountHarness();
    api.volumeStyle.value = 'histogram';
    await nextTick();
    expect(container.querySelector('g.d3-chart__volume rect')).not.toBeNull();
  });

  it('hides the marker layer when toggled off', async () => {
    const { api, container } = mountHarness();
    api.showMarkers.value = false;
    await nextTick();
    expect(container.querySelector('g.d3-chart__markers *')).toBeNull();
  });

  it('drops reference lines whose level never occurs in the data', async () => {
    const history = makePoints(100);
    const trueAllTimeHigh = Math.max(...history.map((point) => point.high));
    // The model looked the all-time high up on the web and got it wrong.
    const driftedLevel = trueAllTimeHigh * 1.3;
    const { api, container } = mountHarness({
      history,
      referenceLines: [
        { value: trueAllTimeHigh, label: 'ATH (true)', color: 'status-error' },
        { value: driftedLevel, label: 'ATH (web)', color: 'status-error' },
      ],
    });
    const textOf = () =>
      [...container.querySelectorAll('g.d3-chart__reference text')].map(
        (node) => node.textContent ?? '',
      );

    // The extreme level renders with the canonical range label; the drifted
    // web-search level never does.
    expect(textOf().some((text) => text.includes('ATH (web)'))).toBe(false);
    expect(textOf().some((text) => text.includes('3M HIGH'))).toBe(true);

    // Nor may it float into view above the plot after a big vertical drag.
    api.panBy(0, 200);
    expect(textOf().some((text) => text.includes('ATH (web)'))).toBe(false);
  });

  it('always shows the range HIGH/LOW level lines from the series', async () => {
    const { api, container } = mountHarness();

    // Fit the full series so both extremes are in view.
    await api.reset();

    const levelTexts = [
      ...container.querySelectorAll('g.d3-chart__reference text'),
    ].map((node) => node.textContent ?? '');
    expect(levelTexts.some((text) => text.includes('All HIGH'))).toBe(true);
    expect(levelTexts.some((text) => text.includes('All LOW'))).toBe(true);

    // The canonical bullets are back on the extreme bars, one per side.
    const markerWords = [
      ...container.querySelectorAll(
        'g.d3-chart__marker .d3-chart__marker-word',
      ),
    ].map((node) => node.textContent ?? '');
    expect(markerWords).toContain('All HIGH');
    expect(markerWords).toContain('All LOW');

    // Every dashed level line carries a dot where it crosses the actual
    // value: on the line, at the nearest bar's x.
    const dots = [
      ...container.querySelectorAll('circle.d3-chart__reference-dot'),
    ];
    expect(dots.length).toBeGreaterThan(0);
    for (const dot of dots) {
      expect(Number(dot.getAttribute('r'))).toBeGreaterThan(0);
      expect(dot.getAttribute('fill')).toBeTruthy();
      const refGroup = dot.closest('g.d3-chart__reference');
      const line = refGroup?.querySelector('line.d3-chart__reference-line');
      // The dot sits on its dashed line.
      expect(Number(dot.getAttribute('cy'))).toBe(
        Number(line?.getAttribute('y1')),
      );
    }
  });

  it('replaces a model extreme line with the canonical range label', async () => {
    const history = makePoints(100);
    const minLow = Math.min(...history.map((point) => point.low));
    const { api, container } = mountHarness({
      history,
      referenceLines: [
        { value: minLow, label: '52w Low', color: 'status-error' },
      ],
    });
    await api.reset();

    const levelTexts = [
      ...container.querySelectorAll('g.d3-chart__reference text'),
    ].map((node) => node.textContent ?? '');
    // Exactly one low line, with the canonical label.
    expect(levelTexts.filter((text) => text.includes('LOW'))).toHaveLength(1);
    expect(levelTexts.some((text) => text.includes('All LOW'))).toBe(true);
    expect(levelTexts.some((text) => text.includes('52w Low'))).toBe(false);
    expect(levelTexts.some((text) => text.includes('All HIGH'))).toBe(true);
  });

  it('drops a reference line anchored outside the selected range', async () => {
    const history = makePoints(100);
    // The all-time low sits at the first bar, outside the default 66-bar
    // window — a 52W-style line at that level must not float over the view.
    const minLow = Math.min(...history.map((point) => point.low));
    const { container } = mountHarness({
      history,
      referenceLines: [
        { value: minLow, label: '52W LOW', color: 'status-error' },
      ],
    });

    const levelTexts = [
      ...container.querySelectorAll('g.d3-chart__reference text'),
    ].map((node) => node.textContent ?? '');
    expect(levelTexts.some((text) => text.includes('52W LOW'))).toBe(false);
  });

  it('keeps a reference line anchored inside the selected range', async () => {
    const history = makePoints(100);
    // A level at a mid-window bar's high stays visible.
    const midHigh = history[50].high;
    const { container } = mountHarness({
      history,
      referenceLines: [
        { value: midHigh, label: 'Resistance', color: 'status-error' },
      ],
    });

    const levelTexts = [
      ...container.querySelectorAll('g.d3-chart__reference text'),
    ].map((node) => node.textContent ?? '');
    expect(levelTexts.some((text) => text.includes('Resistance'))).toBe(true);
  });

  it('keeps the buy/sell pivot markers when the model adds annotations', async () => {
    const history = makePoints(100);
    const athBar = history.reduce((best, point) =>
      point.high > best.high ? point : best,
    );
    const { container } = mountHarness({
      history,
      markers: [
        {
          time: athBar.time,
          position: 'aboveBar',
          shape: 'arrowDown',
          color: 'status-error',
          text: `ATH @ ${athBar.high}`,
        },
      ],
    });

    const markers = [...container.querySelectorAll('g.d3-chart__marker')];
    // The model's extreme annotation is dropped in favor of the generated
    // range bullet on the extreme bar; the pivot buy/sell arrows all render.
    expect(markers.length).toBeGreaterThan(1);
    const annotated = markers.find(
      (marker) =>
        marker.querySelector('.d3-chart__marker-word')?.textContent ===
        '3M HIGH',
    );
    expect(annotated).toBeDefined();

    // Paint order inside the marker: the text first, the price in the
    // center, the arrow last (on top of the dashed level line).
    const childClasses = [...annotated!.children].map(
      (child) => child.getAttribute('class') ?? '',
    );
    expect(childClasses[0]).toContain('d3-chart__marker-word');
    expect(childClasses[1]).toContain('d3-chart__marker-price');
    expect(childClasses[2]).toContain('d3-chart__marker-shape');
  });

  it('labels the extreme markers with the selected range', async () => {
    const { api, container } = mountHarness();
    await api.setRange(22); // 1M

    const markerWords = [
      ...container.querySelectorAll(
        'g.d3-chart__marker .d3-chart__marker-word',
      ),
    ].map((node) => node.textContent ?? '');
    expect(markerWords).toContain('1M HIGH');
    expect(markerWords).toContain('1M LOW');
  });

  it('never duplicates model HIGH/LOW markers on the same bar', async () => {
    const history = makePoints(100);
    const athBar = history.reduce((best, point) =>
      point.high > best.high ? point : best,
    );
    const { container } = mountHarness({
      history,
      markers: [
        {
          time: athBar.time,
          position: 'aboveBar',
          shape: 'circle',
          color: 'harmony-1',
          text: `ATH @ ${athBar.high}`,
        },
        {
          time: athBar.time,
          position: 'aboveBar',
          shape: 'circle',
          color: 'harmony-1',
          text: `52W ATH @ ${athBar.high}`,
        },
      ],
    });

    const words = [
      ...container.querySelectorAll(
        'g.d3-chart__marker .d3-chart__marker-word',
      ),
    ].map((node) => node.textContent ?? '');
    // The model's two extreme annotations are dropped; the chart renders a
    // single generated range bullet on the extreme bar.
    expect(words.filter((word) => word.includes('HIGH'))).toHaveLength(1);
    expect(words).toContain('3M HIGH');
  });

  it('builds the legend from the last close', () => {
    const points = makePoints(3, 100);
    const { api } = mountHarness({ history: points });
    expect(api.legend.value).toBe(points[2].close.toFixed(2));
  });

  it('builds the change label from the quote change', () => {
    const { api } = mountHarness({ quoteChange: 1.5, quoteChangeP: 2.5 });
    expect(api.changeLabel.value).toBe('+1.5 +2.5%');
  });

  it('requests older bars on setRange', async () => {
    const { api, onRangeRequest } = mountHarness();
    await api.setRange(22);
    expect(onRangeRequest).toHaveBeenCalledWith(22);
  });

  it('requests all bars on reset', async () => {
    const { api, onRangeRequest } = mountHarness();
    await api.reset();
    expect(onRangeRequest).toHaveBeenCalledWith(null);
  });

  it('shows tooltip rows for the hovered candle', async () => {
    const { api, container } = mountHarness();
    const overlay = container.querySelector('rect.d3-chart__overlay');
    expect(overlay).not.toBeNull();
    overlay!.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }),
    );
    await nextTick();
    expect(api.tooltip.value.visible).toBe(true);
    expect(api.tooltip.value.rows.length).toBeGreaterThan(0);
  });

  it('clamps heatmap cells inside the plot when zoomed into a narrow window', async () => {
    const { api, container } = mountHarness();
    // A 10-bar window shows a price range far narrower than the full
    // history, so full-history bands would bleed past the plot edges.
    await api.setRange(10);
    api.heatmapVariant.value = 'cells';
    await nextTick();

    const cells = container.querySelectorAll('rect.d3-chart__heatmap-cell');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      const y = Number(cell.getAttribute('y'));
      const height = Number(cell.getAttribute('height'));
      expect(y).toBeGreaterThanOrEqual(6); // plot.top
      expect(y + height).toBeLessThanOrEqual(296); // plot.bottom
    }
  });

  it('clamps flow quads inside the plot when zoomed into a narrow window', async () => {
    const { api, container } = mountHarness();
    await api.setRange(10);

    const quads = container.querySelectorAll('path.d3-chart__flow-quad');
    expect(quads.length).toBeGreaterThan(0);
    for (const quad of quads) {
      const numbers =
        quad
          .getAttribute('d')
          ?.match(/-?\d+(\.\d+)?/g)
          ?.map(Number) ?? [];
      // Path is `M x0 y0 L x1 y1 L x2 y2 L x3 y3 Z` — y values sit at odd
      // indices.
      for (let i = 1; i < numbers.length; i += 2) {
        expect(numbers[i]).toBeGreaterThanOrEqual(6); // plot.top
        expect(numbers[i]).toBeLessThanOrEqual(296); // plot.bottom
      }
    }
  });

  it('never accumulates the phantom vertical offset d3-zoom injects into zoom gestures', async () => {
    const { api, container } = mountHarness();
    api.zoomIn();
    api.zoomIn();
    await nextTick();

    const overlay = overlayTransform(container);
    expect(overlay.y).toBe(0);
  });

  it('keeps deliberate vertical pans and resets them on the next zoom', async () => {
    const { api, container } = mountHarness();
    api.panBy(0, 40);
    await nextTick();
    expect(overlayTransform(container).y).not.toBe(0);

    api.zoomIn();
    await nextTick();
    expect(overlayTransform(container).y).toBe(0);
  });

  it('drops the stale vertical pan when backfill data changes the window', async () => {
    const { api, history, container } = mountHarness();
    // Zoom in and pan away from the latest bar so keepCurrentWindow takes the
    // clamp path (instead of the follow-the-edge path).
    api.zoomIn();
    api.panBy(120, 40);
    await nextTick();
    expect(overlayTransform(container).y).not.toBe(0);

    // Older bars arrive prepended (a range backfill landing mid-interaction).
    const oldest = Date.parse(history.value[0].time);
    history.value = [
      ...Array.from({ length: 20 }, (_, i) => {
        const close = 150 + i * 0.3;
        return {
          time: new Date(oldest - (20 - i) * 86_400_000)
            .toISOString()
            .slice(0, 10),
          open: close - 2,
          high: close + 3,
          low: close - 3,
          close,
          volume: 900,
        };
      }),
      ...history.value,
    ];
    await nextTick();

    expect(overlayTransform(container).y).toBe(0);
  });

  it('bounds hard vertical pans so part of the series always stays in view', async () => {
    const { api, container } = mountHarness();
    api.panBy(0, 100000);
    await nextTick();

    const wicks = [...container.querySelectorAll('line.d3-chart__wick')].map(
      (node) => [
        Number(node.getAttribute('y1')),
        Number(node.getAttribute('y2')),
      ],
    );
    expect(
      wicks.some(([y1, y2]) => y1 <= 296 && y2 >= 6), // plot.bottom / plot.top
    ).toBe(true);
  });

  it('removes the svg on unmount', () => {
    const { wrapper, container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
    wrapper.unmount();
    expect(container.querySelector('svg.d3-chart')).toBeNull();
  });
});
