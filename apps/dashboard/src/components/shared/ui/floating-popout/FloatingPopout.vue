<script setup lang="ts">
/**
 * Standalone floating popup window — the chrome around any media surface
 * (video, image, embed) that the app floats over content. Presentational and
 * portable: it holds no state and depends only on other shared UI pieces
 * (`FloatingMediaBar`, `ResizeHandleGrid`), so it can be dropped into another
 * project as-is. Position, size, opacity, and visibility come in from the
 * consumer via normal attribute inheritance (`style` / `class` on the root);
 * drag/resize are forwarded as raw pointer events for the consumer to wire to
 * whatever geometry it owns.
 *
 * Layout: the drag handle + title/opacity/playlist/minimize/close controls
 * live in the bar on top, the media `<slot>` fills the middle, and the
 * eight-direction resize grid wraps the whole window.
 */
import { computed, ref } from 'vue';

import FloatingMediaBar from '@/components/shared/ui/floating-media-bar/FloatingMediaBar.vue';
import ResizeHandleGrid from '@/components/shared/ui/resize-handle-grid/ResizeHandleGrid.vue';
import type { ResizeDirection } from '@/types/resize-direction.model';

import type { FloatingPopoutProps } from './FloatingPopout.types';

const props = withDefaults(defineProps<FloatingPopoutProps>(), {
  title: '',
  showTitleMarquee: false,
  minimizeTitle: 'Minimize',
  closeTitle: 'Close',
  docked: false,
  barAlwaysVisible: true,
});

/** Whether the pointer is currently over the popup (reveals the bar). */
const barHovered = ref(false);

/** The bar is shown unless auto-hide is on and the pointer is away. */
const barVisible = computed(() => props.barAlwaysVisible || barHovered.value);

const emit = defineEmits<{
  /** Pointer down on free bar space starts dragging the popup. */
  drag: [event: PointerEvent];
  opacityInput: [percent: number];
  togglePlaylist: [];
  minimize: [];
  close: [];
  resize: [direction: ResizeDirection, event: PointerEvent];
}>();

function handleResize(direction: ResizeDirection, event: PointerEvent) {
  emit('resize', direction, event);
}
</script>

<template>
  <div
    class="floating-popout"
    :class="{ 'floating-popout--docked': docked }"
    @mouseenter="barHovered = true"
    @mouseleave="barHovered = false"
  >
    <FloatingMediaBar
      v-if="!docked"
      :class="{ 'floating-media-bar--collapsed': !barVisible }"
      :title="title"
      :show-title-marquee="showTitleMarquee"
      :opacity-percent="opacityPercent"
      :is-in-playlist="isInPlaylist"
      :minimize-title="minimizeTitle"
      :close-title="closeTitle"
      @drag="emit('drag', $event)"
      @opacity-input="emit('opacityInput', $event)"
      @toggle-playlist="emit('togglePlaylist')"
      @minimize="emit('minimize')"
      @close="emit('close')"
    />

    <div class="floating-popout__media">
      <slot />
    </div>

    <ResizeHandleGrid v-if="!docked" @resize="handleResize" />
  </div>
</template>

<style scoped>
.floating-popout {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-border) 45%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 55%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  box-shadow:
    0 0.5rem 2rem color-mix(in srgb, black 45%, transparent),
    0 0 0.5rem color-mix(in srgb, var(--color-accent-glow) 25%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 6%, transparent);
  transition: border-color 0.2s ease;
  overflow: visible;
}

.floating-popout:hover {
  border-color: var(--color-accent-border);
}

/* Docked/bare: the window sits inline over its source — no frame, no
   chrome; size/position come from the consumer's root style. */
.floating-popout--docked {
  width: auto;
  max-width: none;
  border: none;
  background: var(--color-bg-tertiary);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}

.floating-popout--docked .floating-popout__media {
  aspect-ratio: auto;
}

.floating-popout__media {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  aspect-ratio: 16 / 9;
  background: color-mix(in srgb, var(--color-bg-tertiary) 60%, transparent);
  overflow: hidden;
}

/* Any media surface slotted in fills the media box; consumers can override
   with their own class. */
.floating-popout__media :slotted(*) {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

/* Auto-hide bar: the bar is a direct child of the popup root (so drag still
   resolves it via parentElement) and collapses in place — max-height fades
   the bar away while the media box grows to fill the freed space. */
.floating-popout :deep(.floating-media-bar) {
  max-height: 4rem;
  opacity: 1;
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease,
    padding-top 0.3s ease,
    padding-bottom 0.3s ease,
    border-bottom-width 0.3s ease;
}

.floating-popout :deep(.floating-media-bar--collapsed) {
  max-height: 0;
  opacity: 0;
  /* max-height alone leaves the bar's padding + border as residual height
     (the content box can't go negative) — zero them so the bar fully
     disappears and the media grows into the freed space. */
  padding-top: 0;
  padding-bottom: 0;
  border-bottom-width: 0;
}
</style>
