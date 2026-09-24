import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';

import { useD3Chart } from './use-d3-chart.composable';

function makePoints(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    high: 100 + i,
    low: 90 + i,
    volume: 1000,
  }));
}

interface HarnessOverrides {
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  dataLength?: number;
}

function mountHarness(overrides: HarnessOverrides = {}) {
  const dataLength = overrides.dataLength ?? 100;
  const points = makePoints(dataLength);
  const render = vi.fn();
  const onRangeRequest = overrides.onRangeRequest ?? vi.fn();
  const deps = ref([1]);

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

  const Harness = defineComponent({
    setup() {
      const api = useD3Chart({
        containerRef,
        getDataLength: () => dataLength,
        getPoint: (i) => points[i],
        formatPrice: (price) => price.toFixed(2),
        onRangeRequest,
        volumeSplit: () => false,
        markerHeadroomPx: () => 0,
        render,
        watchSources: () => [deps.value],
      });
      return { api };
    },
    template: '<div />',
  });

  const wrapper = mount(Harness);
  return {
    wrapper,
    api: wrapper.vm.api,
    render,
    onRangeRequest,
    deps,
    container,
  };
}

describe('useD3Chart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('mounts an svg and shows the default trailing window', () => {
    const { container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
  });

  it('renders the leaf layers on every render pass', () => {
    const { render } = mountHarness();
    expect(render).toHaveBeenCalled();
  });

  it('shows the last DEFAULT_RANGE_BARS by default', () => {
    const { api } = mountHarness();
    const window = api.getVisibleWindow();
    expect(window.from).toBeCloseTo(34, 5);
    expect(window.to).toBeCloseTo(100, 5);
  });

  it('requests older bars and tracks the active range on setRange', async () => {
    const { api, onRangeRequest } = mountHarness();

    await api.setRange(10);

    expect(onRangeRequest).toHaveBeenCalledWith(10);
    const window = api.getVisibleWindow();
    expect(window.from).toBeCloseTo(90, 5);
    expect(window.to).toBeCloseTo(100, 5);
  });

  it('requests all bars and fits the view on reset', async () => {
    const { api, onRangeRequest } = mountHarness();

    await api.reset();

    expect(onRangeRequest).toHaveBeenCalledWith(null);
    const window = api.getVisibleWindow();
    expect(window.from).toBeCloseTo(0, 5);
    expect(window.to).toBeCloseTo(100, 5);
  });

  it('zooms in around the visible window center', () => {
    const { api } = mountHarness();
    const before = api.getVisibleWindow();

    api.zoomIn();

    const after = api.getVisibleWindow();
    const beforeSpan = before.to - before.from;
    const afterSpan = after.to - after.from;
    expect(afterSpan).toBeLessThan(beforeSpan);
    expect(afterSpan).toBeCloseTo(beforeSpan / 1.5, 5);
    const beforeCenter = (before.from + before.to) / 2;
    const afterCenter = (after.from + after.to) / 2;
    expect(afterCenter).toBeCloseTo(beforeCenter, 5);
  });

  it('zooms out from the visible window center', () => {
    const { api } = mountHarness();
    api.zoomIn();
    const before = api.getVisibleWindow();
    const beforeSpan = before.to - before.from;

    api.zoomOut();

    const after = api.getVisibleWindow();
    expect(after.to - after.from).toBeGreaterThan(beforeSpan);
  });

  it('keeps the selected range when the watch sources change', async () => {
    const { api, deps } = mountHarness();
    await api.setRange(22);
    expect(api.getVisibleWindow().from).toBeCloseTo(78, 5);

    deps.value = [2];
    await nextTick();

    // Data updates re-window to the intended range — no snap-back to default.
    expect(api.getVisibleWindow().from).toBeCloseTo(78, 5);
  });

  it('confines panning to the selected range while allowing full traversal', async () => {
    const { api } = mountHarness();

    // A 22-bar range starting from the latest data.
    await api.setRange(22);
    expect(api.getVisibleWindow().from).toBeCloseTo(78, 5);
    expect(api.getVisibleWindow().to).toBeCloseTo(100, 5);

    // Dragging toward older data at the full range: the window can't move.
    api.panBy(2000, 0);
    expect(api.getVisibleWindow().from).toBeCloseTo(78, 5);
    expect(api.getVisibleWindow().to).toBeCloseTo(100, 5);

    // Zoomed in, panning traverses the whole range and stops at its edges.
    api.zoomIn();
    api.zoomIn();
    const zoomedIn = api.getVisibleWindow();
    expect(zoomedIn.to - zoomedIn.from).toBeLessThan(11);

    api.panBy(2000, 0);
    expect(api.getVisibleWindow().from).toBeCloseTo(78, 5);

    api.panBy(-4000, 0);
    expect(api.getVisibleWindow().to).toBeCloseTo(100, 5);

    // Zooming out never grows the window beyond the range.
    api.zoomOut();
    api.zoomOut();
    api.zoomOut();
    const zoomedOut = api.getVisibleWindow();
    expect(zoomedOut.to - zoomedOut.from).toBeLessThanOrEqual(22 + 1e-6);
    expect(zoomedOut.from).toBeGreaterThanOrEqual(78 - 1e-6);
  });

  it('keeps a scrolled-back view when the data changes', async () => {
    const { api, deps } = mountHarness();
    await api.setRange(22);

    // Zoom in and scroll to the range start, away from the latest bar.
    api.zoomIn();
    api.panBy(2000, 0);
    const before = api.getVisibleWindow();
    expect(before.to).toBeLessThan(95);

    // A data/annotation update must not snap the view to the range end.
    deps.value = [2];
    await nextTick();

    const after = api.getVisibleWindow();
    expect(after.from).toBeCloseTo(before.from, 5);
    expect(after.to).toBeCloseTo(before.to, 5);
  });

  it('removes the svg on unmount', () => {
    const { wrapper, container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
    wrapper.unmount();
    expect(container.querySelector('svg.d3-chart')).toBeNull();
  });

  it('subscribes and unsubscribes crosshair listeners', () => {
    const { api } = mountHarness();
    const listener = vi.fn();
    const unsubscribe = api.onCrosshair(listener);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  /** The y domain of the last render pass. */
  function yDomainOf(render: ReturnType<typeof mountHarness>['render']) {
    return (
      render.mock.calls.at(-1)?.[0] as { y: { domain: () => number[] } }
    ).y.domain();
  }

  it('keeps the fitted y scale while panning and re-fits on a range change', async () => {
    const { api, render } = mountHarness();

    // Zoom in first so the window is smaller than the active range and can
    // pan inside it.
    api.zoomIn();
    const initial = yDomainOf(render);
    const before = api.getVisibleWindow();

    // Pan horizontally: same zoom scale factor, so the visible window moves
    // but the fitted y scale must stay put — the series keeps its shape
    // while dragging.
    api.panBy(-60, 0);

    expect(api.getVisibleWindow().from).not.toBeCloseTo(before.from, 5);
    expect(yDomainOf(render)).toEqual(initial);

    // A range change re-fits the y scale to the new window.
    await api.setRange(10);
    expect(yDomainOf(render)).not.toEqual(initial);
  });

  it('shifts the price domain vertically when dragging up/down', () => {
    const { api, render } = mountHarness();

    const fitted = yDomainOf(render);
    api.panBy(0, 30);
    const shifted = yDomainOf(render);

    // Same price span (no reshape); the domain just moves with the drag.
    expect(shifted[1] - shifted[0]).toBeCloseTo(fitted[1] - fitted[0], 5);
    expect(shifted[0]).toBeGreaterThan(fitted[0]);
  });

  it('re-fits the y scale on a zoom', () => {
    const { api, render } = mountHarness();

    const initial = yDomainOf(render);
    api.zoomIn();
    expect(yDomainOf(render)).not.toEqual(initial);
  });
});
