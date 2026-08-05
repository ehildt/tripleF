<script setup lang="ts">
/**
 * Shared chrome bar for floating media popups: drag handle, title (static or
 * marquee), opacity slider, playlist toggle, and close button.
 *
 * The whole bar acts as a drag handle; interactive controls stop pointer
 * events so they never initiate a drag.
 */
import { ListCheck, ListPlus, Minus, X } from '@lucide/vue';
import { computed } from 'vue';

import MotionIcon from '../motion-icon/MotionIcon.vue';

interface Props {
  /** Title shown statically or in the marquee. */
  title?: string;
  /** Scroll the title when the playlist panel is not visible. */
  showTitleMarquee?: boolean;
  /** Player opacity in percent (25–100). */
  opacityPercent: number;
  /** Whether the video is already in the playlist. */
  isInPlaylist: boolean;
  /** Accessible label/title of the minimize button. */
  minimizeTitle?: string;
  /** Accessible label/title of the close button. */
  closeTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showTitleMarquee: false,
  minimizeTitle: 'Minimize',
  closeTitle: 'Close video',
});

const emit = defineEmits<{
  /** Pointer down on free bar space starts dragging the popup. */
  drag: [event: PointerEvent];
  opacityInput: [percent: number];
  togglePlaylist: [];
  minimize: [];
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
  <header class="floating-media-bar" @pointerdown="emit('drag', $event)">
    <span v-if="!showTitleMarquee" class="floating-media-bar__title">{{
      title
    }}</span>
    <span
      v-else
      class="floating-media-bar__title floating-media-bar__title--marquee"
    >
      <span class="floating-media-bar__marquee-track">
        <span class="floating-media-bar__marquee-text">{{ title }}</span>
        <span class="floating-media-bar__marquee-text" aria-hidden="true">{{
          title
        }}</span>
      </span>
    </span>

    <span class="floating-media-bar__controls">
      <input
        type="range"
        class="floating-media-bar__opacity-slider"
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
        class="floating-media-bar__playlist-toggle"
        :class="{
          'floating-media-bar__playlist-toggle--added': isInPlaylist,
        }"
        :aria-pressed="isInPlaylist"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-label="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        @pointerdown.stop
        @click.stop="emit('togglePlaylist')"
      >
        <MotionIcon>
          <ListCheck
            v-if="isInPlaylist"
            class="floating-media-bar__playlist-icon"
          />
          <ListPlus v-else class="floating-media-bar__playlist-icon" />
        </MotionIcon>
      </button>
      <button
        type="button"
        class="floating-media-bar__minimize"
        :aria-label="minimizeTitle"
        :title="minimizeTitle"
        @pointerdown.stop
        @click.stop="emit('minimize')"
      >
        <MotionIcon
          ><Minus class="floating-media-bar__minimize-icon"
        /></MotionIcon>
      </button>
      <button
        type="button"
        class="floating-media-bar__close"
        :aria-label="closeTitle"
        :title="closeTitle"
        @pointerdown.stop
        @click.stop="emit('close')"
      >
        <MotionIcon><X class="floating-media-bar__close-icon" /></MotionIcon>
      </button>
    </span>
  </header>
</template>

<style scoped>
.floating-media-bar {
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

.floating-media-bar:active {
  cursor: grabbing;
}

.floating-media-bar__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

/* Marquee mode: the duplicated span makes the wrap from -50% back to 0
   invisible. */
.floating-media-bar__title--marquee {
  display: flex;
  align-items: center;
  text-overflow: clip;
}

.floating-media-bar__marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: floating-media-bar-scroll 12s linear infinite;
}

.floating-media-bar__marquee-text {
  padding-right: var(--spacing-9\.5);
}

@keyframes floating-media-bar-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-media-bar__marquee-track {
    animation: none;
  }
}

/* Right-aligned icon cluster with equal gap-1 spacing. */
.floating-media-bar__controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.floating-media-bar__opacity-slider {
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

.floating-media-bar__opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.66rem;
  height: 0.66rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
  transition: transform 0.15s ease;
}

.floating-media-bar__opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.floating-media-bar__opacity-slider::-moz-range-track {
  height: 0.25rem;
  background: transparent;
}

.floating-media-bar__opacity-slider::-moz-range-thumb {
  width: 0.55rem;
  height: 0.55rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
  transition: transform 0.15s ease;
}

.floating-media-bar__opacity-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* Icon buttons: identical square boxes, identical icon sizes. */
.floating-media-bar__playlist-toggle,
.floating-media-bar__minimize,
.floating-media-bar__close {
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

/* Playlist toggle is a quiet nav-style icon like the inline video cards —
   no glass chip, no backdrop, no box-shadow. */
.floating-media-bar__playlist-toggle:hover {
  color: var(--color-fg-primary);
}

.floating-media-bar__playlist-toggle--added,
.floating-media-bar__playlist-toggle--added:hover {
  color: var(--color-accent-primary);
}

.floating-media-bar__minimize:hover {
  color: var(--color-fg-primary);
}

.floating-media-bar__close:hover {
  color: var(--color-status-error);
}

.floating-media-bar__playlist-icon,
.floating-media-bar__minimize-icon,
.floating-media-bar__close-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
