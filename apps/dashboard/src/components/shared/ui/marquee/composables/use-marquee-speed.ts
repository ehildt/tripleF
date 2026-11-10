import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const MARQUEE_SPEED_PX_PER_SECOND = 50;
const FALLBACK_DURATION_SECONDS = 12;

/**
 * Keep the marquee's linear scroll speed constant in pixels per second. The
 * track contains two identical cycles, so half its rendered width is the
 * distance travelled by one loop. Observing the track also covers Markdown
 * rendering, content updates, and font-driven width changes.
 */
export function useMarqueeSpeed(trackRef: Ref<HTMLElement | null>): void {
  let resizeObserver: ResizeObserver | null = null;

  function updateAnimationDuration(): void {
    const track = trackRef.value;
    if (!track) return;

    const cycleWidth = track.getBoundingClientRect().width / 2;
    const durationSeconds =
      cycleWidth > 0
        ? cycleWidth / MARQUEE_SPEED_PX_PER_SECOND
        : FALLBACK_DURATION_SECONDS;
    track.style.animationDuration = `${durationSeconds}s`;
  }

  onMounted(() => {
    const track = trackRef.value;
    if (!track) return;

    updateAnimationDuration();
    resizeObserver = new ResizeObserver(updateAnimationDuration);
    resizeObserver.observe(track);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
}
