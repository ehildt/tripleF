import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, type Ref, ref } from 'vue';

import type { D3CrosshairEvent } from './use-d3-chart.composable';
import { useD3ChartTooltip } from './use-d3-chart-tooltip.composable';

const EVENT: D3CrosshairEvent = {
  x: 200,
  y: 150,
  index: 5,
  time: '2026-01-05',
  price: 101.5,
};

function fakeEngine() {
  const listeners = new Set<(event: D3CrosshairEvent | null) => void>();
  return {
    onCrosshair: vi.fn((listener: (event: D3CrosshairEvent | null) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    emit(event: D3CrosshairEvent | null) {
      for (const listener of listeners) listener(event);
    },
  };
}

function mountHarness(options: { enabled?: Ref<boolean> } = {}) {
  const buildRows = vi.fn((event: D3CrosshairEvent) => [
    { label: 'Close', value: String(event.price) },
  ]);
  const engine = fakeEngine();

  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', {
    value: 600,
    configurable: true,
  });
  Object.defineProperty(container, 'clientHeight', {
    value: 300,
    configurable: true,
  });
  const containerRef = ref<HTMLDivElement | null>(container);
  const tooltipRoot = document.createElement('div');
  Object.defineProperty(tooltipRoot, 'offsetWidth', {
    value: 140,
    configurable: true,
  });
  Object.defineProperty(tooltipRoot, 'offsetHeight', {
    value: 92,
    configurable: true,
  });
  const tooltipRef = ref<{ rootEl: HTMLElement | null } | null>({
    rootEl: tooltipRoot,
  });

  const Harness = defineComponent({
    setup() {
      const { tooltip } = useD3ChartTooltip({
        containerRef,
        engine,
        tooltipRef,
        buildRows,
        enabled: options.enabled,
      });
      return { tooltip, getTooltip: () => tooltip.value };
    },
    template: '<div />',
  });

  const wrapper = mount(Harness);
  return {
    wrapper,
    getTooltip: wrapper.vm.getTooltip as () => {
      visible: boolean;
      x: number;
      y: number;
      rows: unknown[];
    },
    engine,
    buildRows,
  };
}

describe('useD3ChartTooltip', () => {
  it('subscribes to the engine crosshair events', () => {
    const { engine } = mountHarness();
    expect(engine.onCrosshair).toHaveBeenCalled();
  });

  it('shows the tooltip with rows at the computed position', () => {
    const { engine, getTooltip, buildRows } = mountHarness();
    engine.emit(EVENT);

    const state = getTooltip();
    expect(state.visible).toBe(true);
    expect(buildRows).toHaveBeenCalledWith(EVENT);
    expect(state.rows).toEqual([{ label: 'Close', value: '101.5' }]);
    // Panel sits after the cursor by the gap, centered vertically.
    expect(state.x).toBe(200 + 28);
    expect(state.y).toBe(150 - 46);
  });

  it('hides the tooltip when the crosshair leaves the chart', () => {
    const { engine, getTooltip } = mountHarness();
    engine.emit(EVENT);
    engine.emit(null);

    expect(getTooltip().visible).toBe(false);
  });

  it('hides the tooltip when no rows are built', () => {
    const { engine, getTooltip, buildRows } = mountHarness();
    buildRows.mockReturnValue(null);
    engine.emit(EVENT);

    expect(getTooltip().visible).toBe(false);
  });

  it('flips the panel before the cursor near the right edge', () => {
    const { engine, getTooltip } = mountHarness();
    engine.emit({ ...EVENT, x: 560 });

    expect(getTooltip().x).toBe(560 - 28 - 140);
  });

  it('keeps the tooltip hidden while disabled, without building rows', () => {
    const enabled = ref(false);
    const { engine, getTooltip, buildRows } = mountHarness({ enabled });
    engine.emit(EVENT);

    expect(getTooltip().visible).toBe(false);
    expect(buildRows).not.toHaveBeenCalled();
  });

  it('hides the visible tooltip immediately when disabled', async () => {
    const enabled = ref(true);
    const { engine, getTooltip } = mountHarness({ enabled });
    engine.emit(EVENT);
    expect(getTooltip().visible).toBe(true);

    enabled.value = false;
    await nextTick();

    expect(getTooltip().visible).toBe(false);
  });

  it('shows the tooltip again once re-enabled', async () => {
    const enabled = ref(false);
    const { engine, getTooltip } = mountHarness({ enabled });
    engine.emit(EVENT);
    expect(getTooltip().visible).toBe(false);

    enabled.value = true;
    await nextTick();
    engine.emit(EVENT);

    expect(getTooltip().visible).toBe(true);
  });
});
