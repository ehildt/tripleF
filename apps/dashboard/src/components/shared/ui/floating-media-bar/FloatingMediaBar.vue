<script setup lang="ts">
/**
 * Shared chrome bar for floating media popups: drag handle, title (static or
 * marquee), opacity toggle (mirror-rectangular icon), playlist toggle, and
 * close button.
 *
 * The whole bar acts as a drag handle; interactive controls stop pointer
 * events so they never initiate a drag.
 */
import { Minus, MirrorRectangular, X } from '@lucide/vue';

import PlaylistToggleButton from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/shared/ui/playlist-toggle-button/PlaylistToggleButton.vue';

import Marquee from '../marquee/Marquee.vue';
import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { FloatingMediaBarProps } from './FloatingMediaBar.types';

const props = withDefaults(defineProps<FloatingMediaBarProps>(), {
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

/**
 * The mirror-rectangular icon toggles the popup between opaque (100%) and
 * translucent (66%); any other leftover value goes back to opaque.
 */
function toggleOpacity() {
  emit('opacityInput', props.opacityPercent >= 100 ? 66 : 100);
}
</script>

<template>
  <header class="floating-media-bar" @pointerdown="emit('drag', $event)">
    <span v-if="!showTitleMarquee" class="floating-media-bar__title">{{
      title
    }}</span>
    <Marquee
      v-else
      class="floating-media-bar__title floating-media-bar__title--marquee"
      :text="title"
    />

    <span class="floating-media-bar__controls">
      <Tooltip
        class="floating-media-bar__opacity-toggle-tooltip"
        :text="$t('common.opacity', { percent: opacityPercent })"
      >
        <button
          type="button"
          class="floating-media-bar__opacity-toggle"
          :class="{
            'floating-media-bar__opacity-toggle--translucent':
              opacityPercent < 100,
          }"
          :aria-label="$t('common.popupOpacity', { percent: opacityPercent })"
          @pointerdown.stop
          @click.stop="toggleOpacity"
        >
          <MotionIcon>
            <MirrorRectangular class="floating-media-bar__opacity-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <PlaylistToggleButton
        :active="isInPlaylist"
        size="sm"
        @toggle="emit('togglePlaylist')"
      />
      <Tooltip :text="minimizeTitle">
        <button
          type="button"
          class="floating-media-bar__minimize"
          :aria-label="minimizeTitle"
          @pointerdown.stop
          @click.stop="emit('minimize')"
        >
          <MotionIcon
            ><Minus class="floating-media-bar__minimize-icon"
          /></MotionIcon>
        </button>
      </Tooltip>
      <Tooltip :text="closeTitle">
        <button
          type="button"
          class="floating-media-bar__close"
          :aria-label="closeTitle"
          @pointerdown.stop
          @click.stop="emit('close')"
        >
          <MotionIcon><X class="floating-media-bar__close-icon" /></MotionIcon>
        </button>
      </Tooltip>
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
   invisible. The Marquee component owns the scroll; this only overrides the
   static title's ellipsis so the track isn't clipped mid-glyph. */
.floating-media-bar__title--marquee {
  text-overflow: clip;
}

/* Right-aligned icon cluster with equal gap-1 spacing. */
.floating-media-bar__controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.floating-media-bar__opacity-toggle,
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

/* Opacity toggle is a quiet nav-style icon like the inline video cards —
   no glass chip, no backdrop, no box-shadow. */
.floating-media-bar__opacity-toggle:hover {
  color: var(--color-fg-primary);
}

/* Translucent mode (66%): the mirror icon turns accent so the popup's
   current opacity state is visible at a glance. */
.floating-media-bar__opacity-toggle--translucent,
.floating-media-bar__opacity-toggle--translucent:hover {
  color: var(--color-accent-primary);
}

.floating-media-bar__minimize:hover {
  color: var(--color-fg-primary);
}

.floating-media-bar__close:hover {
  color: var(--color-status-error);
}

.floating-media-bar__opacity-icon,
.floating-media-bar__minimize-icon,
.floating-media-bar__close-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
