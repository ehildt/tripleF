import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useExchangeScrollContainer } from './use-exchange-scroll-container';

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
  return {
    scrollTop: 0,
    clientHeight: 100,
    scrollHeight: initialScrollHeight,
    querySelector: vi.fn(),
  } as unknown as HTMLElement;
}

describe('useExchangeScrollContainer', () => {
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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

    await nextTick();
    runRaf();

    expect(container.scrollTop).toBe(300);
  });

  it('scrolls to the bottom when an assistant response becomes active', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>(null);
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

    await nextTick();
    runRaf();

    container.scrollTop = 100;
    onScroll();

    expect(container.scrollTop).toBe(100);
  });

  it('scrolls to the bottom when a new assistant response starts after the user scrolled away', async () => {
    const container = createFakeContainer(500);
    const activeAssistantExchangeId = ref<string | null>('assistant-1');
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      ref(false),
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      activeAssistantResponseStarted,
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      activeAssistantResponseStarted,
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    const { onScroll } = useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      activeAssistantResponseStarted,
    );

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
    const scrollContainerRef = ref<HTMLElement | null>(container);

    useExchangeScrollContainer(
      ref(false),
      activeAssistantExchangeId,
      scrollContainerRef,
      activeAssistantResponseStarted,
    );

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

  it('uses block nearest when scrolling to an exchange', () => {
    const container = createFakeContainer(500);
    const scrollContainerRef = ref<HTMLElement | null>(container);
    const target = document.createElement('div');
    target.scrollIntoView = vi.fn();
    vi.spyOn(container, 'querySelector').mockReturnValue(target);

    const { scrollToExchange } = useExchangeScrollContainer(
      ref(false),
      ref(null),
      scrollContainerRef,
      ref(false),
    );

    scrollToExchange('exchange-1');

    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'nearest',
    });
  });
});
