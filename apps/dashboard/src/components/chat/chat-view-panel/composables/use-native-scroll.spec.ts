import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useNativeScroll } from './use-native-scroll';

function mockRequestAnimationFrame() {
  const frames: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  };
  return () => {
    while (frames.length > 0) {
      const frame = frames.shift();
      frame?.(performance.now());
    }
  };
}

function mockObservers() {
  const resizeInstances: FakeResizeObserver[] = [];
  const mutationInstances: FakeMutationObserver[] = [];

  class FakeResizeObserver implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {
      resizeInstances.push(this);
    }

    observe() {}

    unobserve() {}

    disconnect() {}

    trigger() {
      this.callback([], this);
    }
  }

  class FakeMutationObserver implements MutationObserver {
    constructor(private callback: MutationCallback) {
      mutationInstances.push(this);
    }

    observe() {}

    disconnect() {}

    takeRecords(): MutationRecord[] {
      return [];
    }

    trigger() {
      this.callback([], this);
    }
  }

  const originalResizeObserver = globalThis.ResizeObserver;
  const originalMutationObserver = globalThis.MutationObserver;
  globalThis.ResizeObserver =
    FakeResizeObserver as unknown as typeof ResizeObserver;
  globalThis.MutationObserver =
    FakeMutationObserver as unknown as typeof MutationObserver;

  return {
    restore: () => {
      globalThis.ResizeObserver = originalResizeObserver;
      globalThis.MutationObserver = originalMutationObserver;
    },
    triggerResize: () => {
      resizeInstances.forEach((instance) => instance.trigger());
    },
    triggerMutation: () => {
      mutationInstances.forEach((instance) => instance.trigger());
    },
  };
}

function createFakeContainer(initialScrollHeight: number) {
  const container = {
    scrollTop: 0,
    clientHeight: 100,
    scrollHeight: initialScrollHeight,
    scrollTo: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([]),
  } as unknown as HTMLElement;
  // Mirror the browser: a scrollTo with a target also moves the position.
  container.scrollTo = vi.fn((options?: number | ScrollToOptions) => {
    if (
      typeof options === 'object' &&
      options !== null &&
      typeof options.top === 'number'
    ) {
      container.scrollTop = options.top;
    }
  });
  return container;
}

describe('useNativeScroll', () => {
  let runRaf: () => void;
  let observers: ReturnType<typeof mockObservers>;

  beforeEach(() => {
    vi.useFakeTimers();
    runRaf = mockRequestAnimationFrame();
    observers = mockObservers();
  });

  afterEach(() => {
    runRaf();
    observers.restore();
    globalThis.requestAnimationFrame = window.requestAnimationFrame;
  });

  it('scrolls to the bottom on mount', async () => {
    const container = createFakeContainer(300);
    const { scrollContainerRef } = useNativeScroll();
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(300);
  });

  it('skips the container-creation scroll-to-bottom when skipInitialScroll is set', async () => {
    const container = createFakeContainer(300);
    const { scrollContainerRef, skipInitialScroll } = useNativeScroll();
    skipInitialScroll.value = true;
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    // The view must stay at the top so a mode switch can navigate to the
    // history item the user was reading instead of landing at the bottom.
    expect(container.scrollTop).toBe(0);
  });

  it('keeps the user at the bottom while content grows during auto-scroll', async () => {
    const container = createFakeContainer(500);
    const { scrollContainerRef } = useNativeScroll();
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(700);
  });

  it('does not pull the user down when content grows after they scrolled away', async () => {
    const container = createFakeContainer(500);
    const { scrollContainerRef, onScroll } = useNativeScroll();
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    container.scrollTop = 100;
    onScroll();

    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(100);
  });

  it('scrolls to the section top when scrolling to a section', () => {
    const container = createFakeContainer(500);
    const section = { offsetTop: 240 } as HTMLElement;
    container.querySelector = vi.fn().mockReturnValue(section);
    const { scrollContainerRef, scrollToSection } = useNativeScroll();
    scrollContainerRef.value = container;

    scrollToSection(2);

    expect(container.querySelector).toHaveBeenCalledWith(
      '[data-section-index="2"]',
    );
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 240,
      behavior: 'auto',
    });
  });

  it('scrolls smoothly to a section when requested', () => {
    const container = createFakeContainer(500);
    const section = { offsetTop: 120 } as HTMLElement;
    container.querySelector = vi.fn().mockReturnValue(section);
    const { scrollContainerRef, scrollToSection } = useNativeScroll();
    scrollContainerRef.value = container;

    scrollToSection(1, true);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 120,
      behavior: 'smooth',
    });
  });

  it('tracks the section nearest the scroll position', () => {
    const container = createFakeContainer(500);
    const sections = [
      { offsetTop: 0 },
      { offsetTop: 200 },
      { offsetTop: 400 },
    ] as HTMLElement[];
    container.querySelectorAll = vi.fn().mockReturnValue(sections);
    const { scrollContainerRef, onScroll, activeSectionIndex } =
      useNativeScroll();
    scrollContainerRef.value = container;

    container.scrollTop = 210;
    onScroll();

    expect(activeSectionIndex.value).toBe(1);
  });

  it('keeps the active section in sync after a programmatic scroll-to-section', () => {
    const container = createFakeContainer(500);
    const sections = [
      { offsetTop: 0 },
      { offsetTop: 200 },
      { offsetTop: 400 },
    ] as HTMLElement[];
    container.querySelectorAll = vi.fn().mockReturnValue(sections);
    container.querySelector = vi.fn().mockReturnValue(sections[1]);
    const { scrollContainerRef, scrollToSection, activeSectionIndex } =
      useNativeScroll();
    scrollContainerRef.value = container;

    scrollToSection(1);

    // The mirrored scrollTo moved the position but no scroll event fired —
    // the active section (which the mode-switch restore reads) must already
    // track the new position instead of holding the stale one.
    expect(activeSectionIndex.value).toBe(1);
  });
});
