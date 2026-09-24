import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { D3ChartPoint } from './D3Chart.types';
import D3UnifiedStockChart from './D3UnifiedStockChart.vue';

function makePoints(count: number): D3ChartPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const close = 200 + Math.sin(i / 3) * 12 + i * 0.4;
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

function mountChart(props: Record<string, unknown> = {}) {
  return mount(D3UnifiedStockChart, {
    props: { history: makePoints(60), ...props },
    attachTo: document.body,
  });
}

describe('D3UnifiedStockChart', () => {
  // The engine measures the canvas via clientWidth/clientHeight; jsdom
  // reports 0, so stub a real size on every element for the initial render.
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      value: 320,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth;
    delete (HTMLElement.prototype as { clientHeight?: unknown }).clientHeight;
    document.body.innerHTML = '';
  });

  it('mounts the d3 svg canvas', () => {
    const wrapper = mountChart();
    expect(wrapper.find('svg.d3-chart').exists()).toBe(true);
  });

  it('renders the four toggle groups with all their options', () => {
    const wrapper = mountChart();
    // price (3) + volume (2) + heatmap (2) + annotations (3)
    expect(wrapper.findAll('[role="group"]')).toHaveLength(4);
    expect(wrapper.findAll('button.chart-toggle')).toHaveLength(10);
  });

  it('switches the price style when a toggle is clicked', async () => {
    const wrapper = mountChart();
    const toggles = wrapper.findAll('button.chart-toggle');
    const lineToggle = toggles[1];
    expect(lineToggle.attributes('aria-pressed')).toBe('false');

    await lineToggle.trigger('click');

    expect(lineToggle.attributes('aria-pressed')).toBe('true');
  });

  it('disables the heatmap variant toggles while volume is histogram', async () => {
    const wrapper = mountChart();
    const toggles = wrapper.findAll('button.chart-toggle');
    const histogramToggle = toggles[3];
    await histogramToggle.trigger('click');

    const heatmapToggles = toggles.slice(5, 7);
    for (const toggle of heatmapToggles) {
      expect(toggle.attributes('disabled')).toBeDefined();
    }
  });

  it('hides the 1D button when no intraday handler is provided', () => {
    const wrapper = mountChart();
    expect(wrapper.text()).not.toContain('1D');
  });

  it('shows the 1D button when an intraday handler is provided', () => {
    const wrapper = mountChart({ onIntraday: () => {} });
    expect(wrapper.text()).toContain('1D');
  });

  it('renders the candle layer', () => {
    const wrapper = mountChart();
    expect(wrapper.find('g.d3-chart__candles').exists()).toBe(true);
  });
});
