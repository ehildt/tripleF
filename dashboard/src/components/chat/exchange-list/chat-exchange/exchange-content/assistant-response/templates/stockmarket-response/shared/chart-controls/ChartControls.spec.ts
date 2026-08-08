import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ChartControls from './ChartControls.vue';

const ALL_LABEL = 'common.all';

function mountControls(props: Record<string, unknown> = {}) {
  return mount(ChartControls, {
    props: {
      showRange: true,
      onRange: vi.fn(),
      onReset: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      ...props,
    },
    global: {
      mocks: { $t: (key: string) => key },
    },
  });
}

function activeLabels(wrapper: ReturnType<typeof mountControls>): string[] {
  return wrapper
    .findAll('.chart-controls__button--active')
    .map((button) => button.text());
}

function zoomedLabels(wrapper: ReturnType<typeof mountControls>): string[] {
  return wrapper
    .findAll('.chart-controls__button--zoomed')
    .map((button) => button.text());
}

describe('ChartControls', () => {
  it('keeps the selected range highlighted in the active color', () => {
    const wrapper = mountControls({
      selectedRangeBars: 132,
      activeRangeLabel: '6M',
    });
    expect(activeLabels(wrapper)).toEqual(['6M']);
    expect(zoomedLabels(wrapper)).toEqual([]);
  });

  it('shows the zoomed-in range in a second color', () => {
    // Selected 6M, zoomed in to 3M: 6M stays active, 3M reads zoomed.
    const wrapper = mountControls({
      selectedRangeBars: 132,
      activeRangeLabel: '3M',
    });
    expect(activeLabels(wrapper)).toEqual(['6M']);
    expect(zoomedLabels(wrapper)).toEqual(['3M']);
  });

  it('removes the zoomed highlight when zooming back out', () => {
    const wrapper = mountControls({
      selectedRangeBars: 132,
      activeRangeLabel: '6M',
    });
    expect(zoomedLabels(wrapper)).toEqual([]);
  });

  it('highlights All for the full-series selection', () => {
    const wrapper = mountControls({
      selectedRangeBars: null,
      activeRangeLabel: 'All',
    });
    expect(activeLabels(wrapper)).toEqual([ALL_LABEL]);
    expect(zoomedLabels(wrapper)).toEqual([]);
  });

  it('clears the highlights while the 1D intraday view is active', () => {
    const wrapper = mountControls({
      selectedRangeBars: 66,
      activeRangeLabel: '3M',
      intradayActive: true,
    });
    expect(activeLabels(wrapper)).toEqual([]);
    expect(zoomedLabels(wrapper)).toEqual([]);
  });

  it('falls back to the last clicked range without a selected-range prop', async () => {
    const wrapper = mountControls();
    await wrapper.find('button').trigger('click'); // 1W
    expect(activeLabels(wrapper)).toEqual(['1W']);
  });

  it('hides range buttons the loaded data does not cover', () => {
    // ~2 years of data: 2Y fits, 5Y does not.
    const wrapper = mountControls({ availableDays: 730 });
    const labels = wrapper
      .findAll('.chart-controls__button')
      .map((b) => b.text());
    expect(labels).toContain('2Y');
    expect(labels).not.toContain('5Y');
    expect(labels).toContain(ALL_LABEL);
  });

  it('shows every range button once the full history is loaded', () => {
    const wrapper = mountControls({ availableDays: 3650 });
    const labels = wrapper
      .findAll('.chart-controls__button')
      .map((b) => b.text());
    expect(labels).toContain('5Y');
    expect(labels).toContain(ALL_LABEL);
  });

  it('disables the 1D button when no intraday data is available', () => {
    const wrapper = mountControls({
      onIntraday: vi.fn(),
      intradayAvailable: false,
    });
    const intraday = wrapper
      .findAll('.chart-controls__button')
      .find((b) => b.text() === '1D');
    expect(intraday).toBeDefined();
    expect(intraday!.attributes('disabled')).toBeDefined();
  });

  it('enables the 1D button once intraday data is available', async () => {
    const onIntraday = vi.fn();
    const wrapper = mountControls({ onIntraday, intradayAvailable: true });
    const intraday = wrapper
      .findAll('.chart-controls__button')
      .find((b) => b.text() === '1D');
    expect(intraday!.attributes('disabled')).toBeUndefined();
    await intraday!.trigger('click');
    expect(onIntraday).toHaveBeenCalled();
  });

  it('emits the range bars on a range click', async () => {
    const onRange = vi.fn();
    const wrapper = mountControls({ onRange });
    const sixMonth = wrapper.findAll('button').find((b) => b.text() === '6M');
    await sixMonth!.trigger('click');
    expect(onRange).toHaveBeenCalledWith(132);
  });

  it('emits reset on the All click', async () => {
    const onReset = vi.fn();
    const wrapper = mountControls({ onReset });
    const all = wrapper.findAll('button').find((b) => b.text() === ALL_LABEL);
    await all!.trigger('click');
    expect(onReset).toHaveBeenCalled();
  });
});
