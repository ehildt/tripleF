import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { useMarqueeSpeed } from './use-marquee-speed';

let resizeCallback: ResizeObserverCallback | undefined;
const originalResizeObserver = globalThis.ResizeObserver;
const observe = vi.fn();
const disconnect = vi.fn();

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  observe = observe;
  unobserve = vi.fn();
  disconnect = disconnect;
}

function mountTrack() {
  return mount(
    defineComponent({
      setup() {
        const trackRef = ref<HTMLElement | null>(null);
        useMarqueeSpeed(trackRef);
        return () => h('span', { ref: trackRef }, 'Marquee track');
      },
    }),
  );
}

function mockTrackWidth(width: number) {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width } as DOMRect);
}

describe('useMarqueeSpeed', () => {
  beforeEach(() => {
    resizeCallback = undefined;
    observe.mockClear();
    disconnect.mockClear();
    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    vi.restoreAllMocks();
  });

  it('scales duration with cycle width at a constant 50 px per second', () => {
    const getBoundingClientRect = mockTrackWidth(400);
    const first = mountTrack();
    expect((first.element as HTMLElement).style.animationDuration).toBe('4s');
    first.unmount();

    getBoundingClientRect.mockReturnValue({ width: 800 } as DOMRect);
    const second = mountTrack();
    expect((second.element as HTMLElement).style.animationDuration).toBe('8s');
    second.unmount();
  });

  it('recalculates duration when the rendered track width changes', () => {
    const getBoundingClientRect = mockTrackWidth(200);
    const wrapper = mountTrack();
    expect((wrapper.element as HTMLElement).style.animationDuration).toBe('2s');

    getBoundingClientRect.mockReturnValue({ width: 600 } as DOMRect);
    resizeCallback?.([], {} as ResizeObserver);

    expect((wrapper.element as HTMLElement).style.animationDuration).toBe('6s');
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('keeps the original duration as a zero-width fallback', () => {
    mockTrackWidth(0);
    const wrapper = mountTrack();

    expect((wrapper.element as HTMLElement).style.animationDuration).toBe(
      '12s',
    );
    wrapper.unmount();
  });
});
