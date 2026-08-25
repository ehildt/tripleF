import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useVerticalCarousel } from './use-vertical-carousel';

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
  const observedElements: Element[] = [];
  const resizeInstances: FakeResizeObserver[] = [];
  const mutationInstances: FakeMutationObserver[] = [];

  class FakeResizeObserver implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {
      resizeInstances.push(this);
    }

    observe(target: Element) {
      observedElements.push(target);
    }

    unobserve() {}

    disconnect() {
      observedElements.length = 0;
    }

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
    observedElements,
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

describe('useVerticalCarousel', () => {
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
    const activeAssistantExchangeId = ref<string | null>(null);
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(300);
  });

  it('skips the container-creation scroll-to-bottom when skipInitialScroll is set', async () => {
    const container = createFakeContainer(300);
    const { scrollContainerRef, skipInitialScroll, scrollToSection } =
      useVerticalCarousel(ref(false), ref(null), ref(false));
    skipInitialScroll.value = true;
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    // The view must stay at the top so a mode switch can navigate to the
    // history item the user was reading instead of landing at the bottom.
    expect(container.scrollTop).toBe(0);

    skipInitialScroll.value = false;
    scrollToSection(2);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 200,
      behavior: 'auto',
    });
  });

  it('scrolls to the bottom when an assistant response becomes active', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>(null);
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    container.scrollTop = 0;
    activeAssistantExchangeId.value = 'assistant-1';

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(500);
  });

  it('saves scroll position when the user scrolls away during an assistant response', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    expect(container.scrollTop).toBe(100);
  });

  it('scrolls to the bottom when a new assistant response starts after the user scrolled away', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    // A different assistant exchange becoming active means the user sent a
    // new prompt — an explicit "take me to the response" gesture that must
    // win over the scrolled-away state.
    container.scrollHeight = 800;
    activeAssistantExchangeId.value = 'assistant-2';

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(800);
  });

  it('restores the saved scroll position when the assistant response finishes', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    activeAssistantExchangeId.value = null;

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(100);
  });

  it('resumes auto-scroll when the user scrolls back to the bottom', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    container.scrollTop = 400;
    onScroll();

    container.scrollHeight = 800;
    activeAssistantExchangeId.value = 'assistant-2';

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(800);
  });

  it('clears saved scroll position when the user returns to the bottom before the response finishes', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    container.scrollTop = 400;
    onScroll();

    activeAssistantExchangeId.value = null;

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(400);
  });

  it('keeps the user at the bottom while content grows during auto-scroll', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    // Simulate content growth while the user is pinned to the bottom.
    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(700);
  });

  it('does not pull the user down when content grows after they scrolled away', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      ref(false),
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    container.scrollTop = 100;
    onScroll();

    // The user is now away from the bottom; a subsequent content growth should
    // not snap them back down.
    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(100);
  });

  it('stops auto-scrolling once the first response content arrives', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const activeAssistantResponseStarted = ref(false);
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      activeAssistantResponseStarted,
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(500);

    // Reasoning done, first response delta: the pin releases so the user can
    // read from the start instead of chasing the streaming tail.
    activeAssistantResponseStarted.value = true;
    await nextTick();

    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(500);
  });

  it('does not restore a position on completion after a response-start release', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const activeAssistantResponseStarted = ref(false);
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      activeAssistantResponseStarted,
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    activeAssistantResponseStarted.value = true;
    await nextTick();

    container.scrollTop = 420;
    activeAssistantExchangeId.value = null;

    await nextTick();
    runRaf();

    // The release saved no position, so finishing must not yank the view.
    expect(container.scrollTop).toBe(420);
  });

  it('re-pins when the user scrolls to the bottom after a response-start release', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const activeAssistantResponseStarted = ref(false);
    const { scrollContainerRef, onScroll } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      activeAssistantResponseStarted,
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    activeAssistantResponseStarted.value = true;
    await nextTick();

    // The user chooses to follow the stream again.
    container.scrollTop = 400;
    onScroll();

    container.scrollHeight = 700;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(700);
  });

  it('re-pins on a new send and releases again when its content starts', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const activeAssistantResponseStarted = ref(true);
    const { scrollContainerRef } = useVerticalCarousel(
      ref(false),
      activeAssistantExchangeId,
      activeAssistantResponseStarted,
    );
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    // New prompt: pending exchange, response not started yet.
    activeAssistantResponseStarted.value = false;
    container.scrollHeight = 800;
    activeAssistantExchangeId.value = 'assistant-2';

    await nextTick();
    runRaf();
    expect(container.scrollTop).toBe(800);

    // First content of the new response: release again.
    activeAssistantResponseStarted.value = true;
    await nextTick();

    container.scrollHeight = 1000;
    observers.triggerResize();
    runRaf();

    expect(container.scrollTop).toBe(800);
  });

  it('snaps to the section top when scrolling to a section', () => {
    const container = createFakeContainer(500);
    container.clientHeight = 100;
    const { scrollContainerRef, scrollToSection } = useVerticalCarousel(
      ref(false),
      ref(null),
      ref(false),
    );
    scrollContainerRef.value = container;

    scrollToSection(2);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 200,
      behavior: 'auto',
    });
  });

  it('snaps smoothly to a section when requested', () => {
    const container = createFakeContainer(500);
    container.clientHeight = 100;
    const { scrollContainerRef, scrollToSection } = useVerticalCarousel(
      ref(false),
      ref(null),
      ref(false),
    );
    scrollContainerRef.value = container;

    scrollToSection(1, true);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 100,
      behavior: 'smooth',
    });
  });

  it('keeps the blend scroll refs in sync after a programmatic snap', async () => {
    const container = createFakeContainer(500);
    container.clientHeight = 100;
    const { scrollContainerRef, scrollToSection, activeSectionIndex } =
      useVerticalCarousel(ref(false), ref(null), ref(false));
    scrollContainerRef.value = container;

    await nextTick();
    runRaf();

    // The user is reading a mid-list section and the DOM re-snaps (e.g. a
    // removed section). No scroll event has fired yet — the active section
    // the blend reads must already track the new position, or the visible
    // slide paints at a stale (possibly zero) opacity until the event lands.
    container.scrollTop = 400;
    scrollToSection(2);

    expect(activeSectionIndex.value).toBe(2);
  });
});
