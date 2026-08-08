import { computed, type Ref } from 'vue';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Compute a single slide's crossfade opacity from its position in the
 * vertical carousel. The slide is fully opaque when centered in the
 * viewport and fades to transparent as it moves one viewport away, so
 * scrolling blends the outgoing section into the incoming one. Because the
 * slides and the carousel share the same background, the crossfade reads as
 * a seamless blend rather than a hard cut.
 *
 * Each carousel slide is exactly one viewport tall, so its top edge sits at
 * `index * viewportHeight`. Computing from the reactive `index` (rather than
 * reading the non-reactive `offsetTop`) keeps the blend correct when a
 * sibling is added or removed and the slide re-indexes — otherwise a deleted
 * section leaves the remaining slides stuck at opacity 0 (an empty view).
 *
 * Opacity-only (no transform/contain) so the slide never becomes a
 * containing block for the floating video popup's fixed-position overlay.
 */
export function useCarouselBlend(
  index: Ref<number>,
  scrollTop: Ref<number>,
  viewportHeight: Ref<number>,
) {
  const opacity = computed(() => {
    if (viewportHeight.value === 0) return 1;

    // The slide's top relative to the carousel's viewport top, normalized by
    // the viewport height: 0 when the slide is centered, ±1 when it is one
    // viewport away.
    const progress =
      (index.value * viewportHeight.value - scrollTop.value) /
      viewportHeight.value;
    return clamp(1 - Math.abs(progress), 0, 1);
  });

  return { opacity };
}
