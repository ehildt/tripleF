import { type ComputedRef, onMounted, ref } from 'vue';

import { calcActiveIndexFromScroll } from '../helpers/calc-active-index-from-scroll.helper';

/**
 * Owns the carousel's active-index state and its track-scroll actions:
 * programmatic scrollTo for the dots/keyboard, and scroll-position → active
 * index syncing. The track element is provided by the caller (it lives in
 * CarouselContent) so the state stays in the orchestrator.
 */
export function useCarouselNavigation(
  trackRef: ComputedRef<HTMLElement | null>,
  itemCount: () => number,
) {
  const activeIndex = ref(0);

  /** Smoothly scroll the track so the given slide is centered. */
  function scrollToIndex(index: number) {
    const track = trackRef.value;
    const item = track?.children[index] as HTMLElement | undefined;
    if (!track || !item) return;

    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const target = itemCenter - track.clientWidth / 2;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    track.scrollTo({
      left: Math.max(0, Math.min(target, maxScroll)),
      behavior: 'smooth',
    });
  }

  /** Re-derive the active index from the track's current scroll position. */
  function onScroll() {
    const track = trackRef.value;
    if (!track || track.clientWidth === 0) return;

    const items = Array.from(track.children).map((child) => {
      const el = child as HTMLElement;
      return { offsetLeft: el.offsetLeft, offsetWidth: el.offsetWidth };
    });
    activeIndex.value = calcActiveIndexFromScroll(
      track.scrollLeft,
      track.clientWidth,
      items,
    );
  }

  function onPrev() {
    scrollToIndex(Math.max(0, activeIndex.value - 1));
  }

  function onNext() {
    scrollToIndex(Math.min(itemCount() - 1, activeIndex.value + 1));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') onPrev();
    else onNext();
  }

  onMounted(onScroll);

  return { activeIndex, onScroll, onPrev, onNext, onKeyDown, scrollToIndex };
}
