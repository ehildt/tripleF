<script setup lang="ts">
/**
 * Chrome of the floating video popup: title (or the scrolling now-playing
 * marquee while the playlist panel is hidden), the opacity slider and the
 * right-aligned icon cluster (playlist add/remove toggle, close) with
 * equal gap-1 spacing. The whole bar is the drag handle; the controls stop
 * pointer events so they never start a drag.
 */
import { ListCheck, ListPlus, X } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  /** Video title shown statically or in the marquee. */
  title?: string;
  /** Scroll the title when the playlist panel is not visible. */
  showTitleMarquee: boolean;
  /** Player opacity in percent (25–100). */
  opacityPercent: number;
  /** Whether the video is already in the playlist. */
  isInPlaylist: boolean;
  /** Accessible label of the close button (per the stop-on-close setting). */
  closeTitle: string;
}>();

const emit = defineEmits<{
  /** Pointer down on free bar space starts dragging the popup. */
  drag: [event: PointerEvent];
  opacityInput: [percent: number];
  togglePlaylist: [];
  close: [];
}>();

/** Fill the slider track with accent up to the current value. */
const opacitySliderStyle = computed(() => {
  const fillPercent = ((props.opacityPercent - 25) / 75) * 100;
  return {
    background: `linear-gradient(to right, var(--color-accent-primary) ${fillPercent}%, var(--color-bg-tertiary) ${fillPercent}%)`,
  };
});

function onOpacityInput(event: Event) {
  emit('opacityInput', Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <!-- No div elements here: the global .exchange-content__body :deep(div)
       rule pads every div inside exchange content, inflating the bar. A
       <header> root with <span> internals sidesteps it entirely. -->
  <header class="floating-video-popup-bar" @pointerdown="emit('drag', $event)">
    <span v-if="!showTitleMarquee" class="floating-video-popup-bar__title">{{
      title
    }}</span>
    <span
      v-else
      class="floating-video-popup-bar__title floating-video-popup-bar__title--marquee"
    >
      <span class="floating-video-popup-bar__marquee-track">
        <span class="floating-video-popup-bar__marquee-text">{{ title }}</span>
        <span
          class="floating-video-popup-bar__marquee-text"
          aria-hidden="true"
          >{{ title }}</span
        >
      </span>
    </span>

    <span class="floating-video-popup-bar__controls">
      <input
        type="range"
        class="floating-video-popup-bar__opacity-slider"
        min="25"
        max="100"
        step="1"
        :value="opacityPercent"
        :style="opacitySliderStyle"
        :aria-label="`Popup opacity: ${opacityPercent}%`"
        :title="`Opacity: ${opacityPercent}%`"
        @pointerdown.stop
        @input="onOpacityInput"
      />
      <button
        type="button"
        class="floating-video-popup-bar__playlist-toggle"
        :class="{
          'floating-video-popup-bar__playlist-toggle--added': isInPlaylist,
        }"
        :aria-pressed="isInPlaylist"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-label="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        @pointerdown.stop
        @click.stop="emit('togglePlaylist')"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="floating-video-popup-bar__playlist-icon"
        />
        <ListPlus v-else class="floating-video-popup-bar__playlist-icon" />
      </button>
      <button
        type="button"
        class="floating-video-popup-bar__close"
        :aria-label="closeTitle"
        :title="closeTitle"
        @pointerdown.stop
        @click.stop="emit('close')"
      >
        <X class="floating-video-popup-bar__close-icon" />
      </button>
    </span>
  </header>
</template>

<style scoped>
.floating-video-popup-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2) var(--spacing-2);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-divider) 70%, transparent);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.floating-video-popup-bar:active {
  cursor: grabbing;
}

.floating-video-popup-bar__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

/* Marquee mode: same seamless loop as the playlist panel — the duplicated
   span makes the wrap from -50% back to 0 invisible. The popout carries it
   whenever the playlist panel is not visible. */
.floating-video-popup-bar__title--marquee {
  display: flex;
  align-items: center;
  text-overflow: clip;
}

.floating-video-popup-bar__marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: floating-video-popup-bar-scroll 12s linear infinite;
}

.floating-video-popup-bar__marquee-text {
  padding-right: var(--spacing-9\.5);
}

@keyframes floating-video-popup-bar-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-video-popup-bar__marquee-track {
    animation: none;
  }
}

/* Right-aligned icon cluster with equal gap-1 spacing. */
.floating-video-popup-bar__controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.floating-video-popup-bar__opacity-slider {
  flex-shrink: 0;
  appearance: none;
  width: 4.5rem;
  height: 0.25rem;
  /* The icon buttons carry inner padding around their glyphs on both
     sides; the track ends flush at its box, so without this margin the
     playlist icon sits optically closer to the slider than to the close. */
  margin-right: var(--spacing-1);
  outline: none;
  cursor: pointer;
}

.floating-video-popup-bar__opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.66rem;
  height: 0.66rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
  transition: transform 0.15s ease;
}

.floating-video-popup-bar__opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.floating-video-popup-bar__opacity-slider::-moz-range-track {
  height: 0.25rem;
  background: transparent;
}

.floating-video-popup-bar__opacity-slider::-moz-range-thumb {
  width: 0.55rem;
  height: 0.55rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
  transition: transform 0.15s ease;
}

.floating-video-popup-bar__opacity-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* Icon buttons: identical square boxes, identical icon sizes — the lucide X
   must be pinned down (it defaults to 24px) or it dwarfs the row. */
.floating-video-popup-bar__playlist-toggle,
.floating-video-popup-bar__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

/* Glass chip for the playlist toggle — matches the media-overlay toggles. */
.floating-video-popup-bar__playlist-toggle {
  color: white;
  background: color-mix(in srgb, black 55%, transparent);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  box-shadow:
    0 0.15rem 0.6rem color-mix(in srgb, black 40%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-video-popup-bar__playlist-toggle:hover {
  color: white;
  background: var(--color-accent-primary);
}

.floating-video-popup-bar__playlist-toggle--added,
.floating-video-popup-bar__playlist-toggle--added:hover {
  color: white;
  background: color-mix(in srgb, var(--color-accent-primary) 85%, transparent);
}

.floating-video-popup-bar__close:hover {
  color: var(--color-status-error);
}

.floating-video-popup-bar__playlist-icon,
.floating-video-popup-bar__close-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.floating-video-popup-bar__playlist-icon {
  filter: drop-shadow(0 1px 2px color-mix(in srgb, black 60%, transparent));
}
</style>
