import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useVerticalCarouselStore } from '@/stores/vertical-carousel';

import { useCarouselBlend } from './use-carousel-blend';

function setup(index: number, scrollTop: number, viewport = 100) {
  setActivePinia(createPinia());
  const store = useVerticalCarouselStore();
  store.scrollTop = scrollTop;
  store.viewportHeight = viewport;
  const indexRef = ref(index);
  const { opacity } = useCarouselBlend(indexRef);
  return { opacity, indexRef, store };
}

describe('useCarouselBlend', () => {
  it.each([
    { scrollTop: 0, expected: 1, label: 'centered in the viewport' },
    { scrollTop: 50, expected: 0.5, label: 'halfway through a transition' },
    { scrollTop: 100, expected: 0, label: 'one viewport away' },
    { scrollTop: 250, expected: 0, label: 'more than one viewport away' },
  ])('is $label at opacity $expected', ({ scrollTop, expected }) => {
    const { opacity } = setup(0, scrollTop);
    expect(opacity.value).toBeCloseTo(expected);
  });

  it('reacts to scroll changes', () => {
    const { opacity, store } = setup(0, 0);
    expect(opacity.value).toBe(1);

    store.scrollTop = 30;
    expect(opacity.value).toBeCloseTo(0.7);
  });

  it('re-evaluates when the slide re-indexes (a sibling is deleted)', () => {
    const { opacity, indexRef } = setup(0, 0);
    expect(opacity.value).toBe(1);

    // A sibling is deleted and this slide moves down a viewport, but scrollTop
    // is unchanged. Because the blend is derived from the reactive index, it
    // re-evaluates to the new position instead of staying at the stale one.
    indexRef.value = 1;
    expect(opacity.value).toBe(0);
  });

  it('returns full opacity when the viewport height is unknown', () => {
    const { opacity } = setup(0, 50, 0);
    expect(opacity.value).toBe(1);
  });
});
