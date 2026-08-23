import { type ComputedRef, onMounted, ref } from 'vue';

import { calcActiveIndexFromScroll } from '../helpers/calc-active-index-from-scroll.helper';

/**
 * Owns the carousel's active-index state and its track-scroll actions:
 * programmatic scrollTo for the dots/keyboard, and scroll-position → active
 * index syncing. The track element is provided by the caller (it lives in
 * CarouselContent) so the state stays in the orchestrator.
 *
 * `initialIndex` centers the track on that slide when the carousel mounts —
 * used to land on the currently playing video when the gallery opens.
 */
export function useCarouselNavigation(
  trackRef: ComputedRef<HTMLElement | null>,
  itemCount: () => number,
  initialIndex = 0,
) {
  const activeIndex = ref(initialIndex);

  /** Scroll the track so the given slide is centered. */
  function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    const track = trackRef.value;
    const item = track?.children[index] as HTMLElement | undefined;
    if (!track || !item) return;

    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const target = itemCenter - track.clientWidth / 2;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const left = Math.max(0, Math.min(target, maxScroll));
    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left, behavior });
    } else {
      track.scrollLeft = left;
    }
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

  onMounted(() => {
    // Land on the requested slide without a visible scroll; the active
    // index already reflects it. Otherwise sync from the scroll position.
    if (initialIndex > 0) scrollToIndex(initialIndex, 'auto');
    else onScroll();
  });

  return { activeIndex, onScroll, onPrev, onNext, onKeyDown, scrollToIndex };
}
