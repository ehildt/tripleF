import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';

import type { D3StackedAreaSeries } from '../D3Chart.types';
import { useD3StackedAreaChart } from './use-d3-stacked-area-chart.composable';

function makeSeries(count: number): D3StackedAreaSeries[] {
  return Array.from({ length: count }, (_, s) => ({
    name: `Series ${s}`,
    points: Array.from({ length: 30 }, (_, i) => ({
      time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      value: 50 + s * 10 + (i % 5) * 2,
    })),
  }));
}

interface HarnessOverrides {
  series?: D3StackedAreaSeries[];
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
}

function mountHarness(overrides: HarnessOverrides = {}) {
  const series = ref<D3StackedAreaSeries[]>(overrides.series ?? makeSeries(3));
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

  const Harness = defineComponent({
    setup() {
      const api = useD3StackedAreaChart({
        containerRef,
        series,
        onRangeRequest,
      });
      return { api };
    },
    template: '<div />',
  });

  const wrapper = mount(Harness);
  return {
    wrapper,
    api: wrapper.vm.api,
    series,
    onRangeRequest,
    container,
  };
}

describe('useD3StackedAreaChart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('mounts an svg in the container', () => {
    const { container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
  });

  it('renders one area and one line path per series', () => {
    const { container } = mountHarness({ series: makeSeries(3) });
    expect(
      container.querySelectorAll('path[class^="d3-chart__stack-area--"]'),
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('path[class^="d3-chart__stack-line--"]'),
    ).toHaveLength(3);
  });

  it('exposes the legend palette', () => {
    const { api } = mountHarness();
    expect(api.STACKED_AREA_PALETTE.length).toBeGreaterThan(0);
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

  it('removes the svg on unmount', () => {
    const { wrapper, container } = mountHarness();
    expect(container.querySelector('svg.d3-chart')).not.toBeNull();
    wrapper.unmount();
    expect(container.querySelector('svg.d3-chart')).toBeNull();
  });
});
