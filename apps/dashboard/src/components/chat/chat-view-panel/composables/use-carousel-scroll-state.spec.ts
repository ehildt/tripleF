import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useCarouselScrollState } from './use-carousel-scroll-state';

function fakeContainer(height = 100): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientHeight', { value: height });
  el.scrollTo = vi.fn((options?: ScrollToOptions) => {
    el.scrollTop = options?.top ?? 0;
  });
  return el;
}

describe('useCarouselScrollState', () => {
  beforeEach(() => {
    // Module-scope singleton: reset the shared refs between tests.
    const state = useCarouselScrollState();
    state.scrollContainerRef.value = null;
    state.scrollTop.value = 0;
    state.viewportHeight.value = 0;
    state.forceTopOnNextTransition.value = false;
    state.previousActiveSectionIndex.value = 0;
  });

  it('mirrors live container metrics into the reactive refs', () => {
    const state = useCarouselScrollState();
    const container = fakeContainer(200);
    container.scrollTop = 350;

    state.syncScrollRefs(container);

    expect(state.scrollTop.value).toBe(350);
    expect(state.viewportHeight.value).toBe(200);
  });

  it('derives the active section index from scroll position, rounded', () => {
    const state = useCarouselScrollState();
    expect(state.activeSectionIndex.value).toBe(0);

    const container = fakeContainer(100);
    container.scrollTop = 240;
    state.syncScrollRefs(container);

    expect(state.activeSectionIndex.value).toBe(2);
  });

  it('tracks the previous active section index when the active one moves', async () => {
    const state = useCarouselScrollState();
    const container = fakeContainer(100);

    container.scrollTop = 100;
    state.syncScrollRefs(container);
    await nextTick();

    container.scrollTop = 300;
    state.syncScrollRefs(container);
    await nextTick();

    expect(state.activeSectionIndex.value).toBe(3);
    expect(state.previousActiveSectionIndex.value).toBe(1);
  });

  it('scrolls to a section top and syncs the refs', () => {
    const state = useCarouselScrollState();
    const container = fakeContainer(100);
    state.scrollContainerRef.value = container;

    state.scrollToSection(2, true);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 200,
      behavior: 'smooth',
    });
    expect(state.scrollTop.value).toBe(200);
    expect(state.viewportHeight.value).toBe(100);
  });

  it('flags force-top on the next transition when reset-to-top is requested', () => {
    const state = useCarouselScrollState();
    expect(state.forceTopOnNextTransition.value).toBe(false);

    const container = fakeContainer(100);
    state.scrollContainerRef.value = container;

    state.scrollToSection(1, false, true);

    expect(state.forceTopOnNextTransition.value).toBe(true);
  });

  it('is a no-op scroller while no container is bound', () => {
    const state = useCarouselScrollState();

    expect(() => state.scrollToSection(3)).not.toThrow();
  });
});
