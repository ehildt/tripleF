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
import FloatingMediaBar from '@/components/shared/ui/floating-media-bar/FloatingMediaBar.vue';
import ResizeHandleGrid, {
  type ResizeDirection,
} from '@/components/shared/ui/resize-handle-grid/ResizeHandleGrid.vue';

interface Props {
  /** Title shown statically or in the marquee. */
  title?: string;
  /** Scroll the title when the playlist panel is not visible. */
  showTitleMarquee?: boolean;
  /** Media opacity in percent (25–100). */
  opacityPercent: number;
  /** Whether the media is already in the playlist. */
  isInPlaylist: boolean;
  /** Accessible label/title of the minimize button. */
  minimizeTitle?: string;
  /** Accessible label/title of the close button. */
  closeTitle?: string;
  /**
   * Bare mode: hide the bar and resize grid and strip the popup frame, so
   * the same media stays mounted while the window "docks" inline over its
   * source. The consumer positions/sizes it via the root style.
   */
  docked?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  showTitleMarquee: false,
  minimizeTitle: 'Minimize',
  closeTitle: 'Close',
  docked: false,
});

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
  <div class="floating-popout" :class="{ 'floating-popout--docked': docked }">
    <FloatingMediaBar
      v-if="!docked"
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
    0 0 1.5rem color-mix(in srgb, var(--color-accent-glow) 25%, transparent),
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
</style>
