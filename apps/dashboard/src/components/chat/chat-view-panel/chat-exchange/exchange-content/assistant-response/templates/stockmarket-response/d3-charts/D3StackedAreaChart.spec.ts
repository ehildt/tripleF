import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { D3StackedAreaSeries } from './D3Chart.types';
import D3StackedAreaChart from './D3StackedAreaChart.vue';

function makeSeries(count: number): D3StackedAreaSeries[] {
  return Array.from({ length: count }, (_, s) => ({
    name: `Series ${s}`,
    points: Array.from({ length: 30 }, (_, i) => ({
      time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      value: 50 + s * 10 + (i % 5) * 2,
    })),
  }));
}

function mountChart(props: Record<string, unknown> = {}) {
  return mount(D3StackedAreaChart, {
    props: { series: makeSeries(3), ...props },
    attachTo: document.body,
  });
}

describe('D3StackedAreaChart', () => {
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

  it('renders one legend item per series', () => {
    const wrapper = mountChart();
    expect(wrapper.findAll('.stacked-area-chart__legend-item')).toHaveLength(3);
  });

  it('does not render the 1D button (no intraday support)', () => {
    const wrapper = mountChart();
    expect(wrapper.text()).not.toContain('1D');
  });

  it('renders the stack layers', () => {
    const wrapper = mountChart();
    expect(wrapper.find('g.d3-chart__stacks').exists()).toBe(true);
  });
});
