import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import type { Exchange } from '@/stores/conversation';

import type { ExchangeSection } from '../helpers/build-exchange-sections.helper';
import ScrollableExchangeList from './ScrollableExchangeList.vue';

const VIEWPORT_HEIGHT = 100;
const TOTAL_SCROLL_HEIGHT = 300;
// Native mode stacks variable-height sections; 140px apart keeps section 1
// nearest to a scrollTop of 150 and section 2 at 280.
const NATIVE_SECTION_OFFSET = 140;

const CarouselSectionStub = defineComponent({
  name: 'CarouselSection',
  props: ['section', 'index'],
  template:
    '<div :data-section-index="index" :data-section-id="section.id"></div>',
});

function buildSections(): ExchangeSection[] {
  return ['user-1', 'user-2', 'user-3'].map((id, index) => ({
    id: `section-${index + 1}`,
    user: { id } as unknown as Exchange,
    assistants: [],
  }));
}

function mockRequestAnimationFrame() {
  const frames: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  };
  return () => {
    while (frames.length > 0) {
      frames.shift()?.(performance.now());
    }
  };
}

/** jsdom has no layout: fake the metrics the scroll composables read. */
function mockLayoutMetrics() {
  const originals = {
    offsetTop: Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetTop',
    ),
    clientHeight: Object.getOwnPropertyDescriptor(
      Element.prototype,
      'clientHeight',
    ),
    scrollHeight: Object.getOwnPropertyDescriptor(
      Element.prototype,
      'scrollHeight',
    ),
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      const index = this.getAttribute('data-section-index');
      return index === null ? 0 : Number(index) * NATIVE_SECTION_OFFSET;
    },
  });
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get: () => VIEWPORT_HEIGHT,
  });
  Object.defineProperty(Element.prototype, 'scrollHeight', {
    configurable: true,
    get: () => TOTAL_SCROLL_HEIGHT,
  });
  return () => {
    for (const [name, descriptor] of Object.entries(originals)) {
      const prototype =
        name === 'offsetTop' ? HTMLElement.prototype : Element.prototype;
      if (descriptor) {
        Object.defineProperty(prototype, name, descriptor);
      }
    }
  };
}

describe('ScrollableExchangeList mode switching', () => {
  let runRaf: () => void;
  let restoreLayout: () => void;
  let scrollToCalls: Array<{ top?: number; behavior?: ScrollBehavior }>;
  let originalScrollTo: typeof HTMLElement.prototype.scrollTo;

  beforeEach(() => {
    runRaf = mockRequestAnimationFrame();
    restoreLayout = mockLayoutMetrics();
    scrollToCalls = [];
    originalScrollTo = window.HTMLElement.prototype.scrollTo;
    window.HTMLElement.prototype.scrollTo = function (
      this: HTMLElement,
      options?: number | ScrollToOptions,
    ) {
      if (typeof options === 'object' && options !== null) {
        scrollToCalls.push({ top: options.top, behavior: options.behavior });
        // Mirror the browser: scrollTo also moves the scroll position.
        if (typeof options.top === 'number') this.scrollTop = options.top;
      }
    } as typeof window.HTMLElement.prototype.scrollTo;
  });

  afterEach(() => {
    runRaf();
    restoreLayout();
    window.HTMLElement.prototype.scrollTo = originalScrollTo;
    globalThis.requestAnimationFrame = window.requestAnimationFrame;
  });

  async function settleRestore() {
    // The restore clears its skip flag in a macrotask after navigating; let
    // the full mode-switch flush (and every mount-time watcher) settle.
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  function mountList(mode: 'carousel' | 'native') {
    return mount(ScrollableExchangeList, {
      props: {
        sections: buildSections(),
        mode,
        highlightedIds: new Set<string>(),
        collapsedIds: new Set<string>(),
        isCompact: false,
        activeAssistantExchangeId: null,
        activeAssistantResponseStarted: false,
      },
      global: { stubs: { CarouselSection: CarouselSectionStub } },
    });
  }

  it('navigates to the history item the user was reading when switching from carousel to native', async () => {
    const wrapper = mountList('carousel');
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    await nextTick();
    runRaf();

    // The user scrolls to the middle exchange (section 1 of 3).
    carousel.scrollTop = VIEWPORT_HEIGHT;
    carousel.dispatchEvent(new Event('scroll'));

    await wrapper.setProps({ mode: 'native' });
    await nextTick();
    await settleRestore();
    runRaf();

    // The native list navigates to that same exchange like a history click
    // instead of jumping to the bottom of the list.
    expect(scrollToCalls).toContainEqual({
      top: NATIVE_SECTION_OFFSET,
      behavior: 'smooth',
    });
    const nativeList = wrapper.find('.native-scroll').element as HTMLElement;
    expect(nativeList.scrollTop).toBe(NATIVE_SECTION_OFFSET);
  });

  it('navigates to the last history item when the carousel is on the last section (reads as at-bottom)', async () => {
    const wrapper = mountList('carousel');
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    await nextTick();
    runRaf();

    // The last carousel section fills the viewport, so the scroll metrics
    // look "at the bottom" even though the user is just reading that item.
    carousel.scrollTop = 2 * VIEWPORT_HEIGHT;
    carousel.dispatchEvent(new Event('scroll'));

    await wrapper.setProps({ mode: 'native' });
    await nextTick();
    await settleRestore();
    runRaf();

    const nativeList = wrapper.find('.native-scroll').element as HTMLElement;
    expect(scrollToCalls).toContainEqual({
      top: 2 * NATIVE_SECTION_OFFSET,
      behavior: 'smooth',
    });
    // The default mount scroll-to-bottom must not stomp the restore.
    expect(nativeList.scrollTop).toBe(2 * NATIVE_SECTION_OFFSET);
  });

  it('re-snaps to the next section when the active section is deleted', async () => {
    const wrapper = mountList('carousel');
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    await nextTick();
    runRaf();

    // The user is reading section 1 of 3.
    carousel.scrollTop = VIEWPORT_HEIGHT;
    carousel.dispatchEvent(new Event('scroll'));

    // Delete a section while reading section 1 of 3 (length 3→2): the next
    // section slides into index 1, so the carousel must snap back there
    // rather than leave an orphaned scroll offset (which renders an empty
    // view via the blend opacity).
    await wrapper.setProps({ sections: buildSections().slice(0, 2) });
    await nextTick();

    expect(scrollToCalls).toContainEqual({
      top: VIEWPORT_HEIGHT,
      behavior: 'auto',
    });
    expect(carousel.scrollTop).toBe(VIEWPORT_HEIGHT);
  });

  it('re-snaps to the previous section when the last section is deleted', async () => {
    const wrapper = mountList('carousel');
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    await nextTick();
    runRaf();

    // The user is reading the last section (index 2 of 3).
    carousel.scrollTop = 2 * VIEWPORT_HEIGHT;
    carousel.dispatchEvent(new Event('scroll'));

    // Deleting the last section leaves no next section to slide in, so the
    // carousel snaps back to the previous section instead of orphaning the
    // scroll offset at a now-empty trailing position.
    await wrapper.setProps({ sections: buildSections().slice(0, 2) });
    await nextTick();

    expect(scrollToCalls).toContainEqual({
      top: VIEWPORT_HEIGHT,
      behavior: 'auto',
    });
    expect(carousel.scrollTop).toBe(VIEWPORT_HEIGHT);
  });

  it('does not re-snap on section changes that are not deletions', async () => {
    const wrapper = mountList('carousel');
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    await nextTick();
    runRaf();

    carousel.scrollTop = VIEWPORT_HEIGHT;
    carousel.dispatchEvent(new Event('scroll'));
    const callsBefore = scrollToCalls.length;

    // Content added or edited within a section changes the array but not its
    // length — the scroll position must be left untouched.
    const grown = [...buildSections(), ...buildSections()];
    await wrapper.setProps({ sections: grown });
    await nextTick();

    expect(scrollToCalls).toHaveLength(callsBefore);
  });

  it('navigates to the history item the user was reading when switching from native to carousel', async () => {
    const wrapper = mountList('native');
    const nativeList = wrapper.find('.native-scroll').element as HTMLElement;
    await nextTick();
    runRaf();

    // Section offsets are 0/140/280; 150 is nearest section 1.
    nativeList.scrollTop = 150;
    nativeList.dispatchEvent(new Event('scroll'));

    await wrapper.setProps({ mode: 'carousel' });
    await nextTick();
    await settleRestore();
    runRaf();

    // The carousel snaps to that section's top (index × viewport height).
    expect(scrollToCalls).toContainEqual({
      top: VIEWPORT_HEIGHT,
      behavior: 'smooth',
    });
    // The default mount scroll-to-bottom must not stomp the restore.
    const carousel = wrapper.find('.vertical-carousel').element as HTMLElement;
    expect(carousel.scrollTop).toBe(VIEWPORT_HEIGHT);
  });
});
