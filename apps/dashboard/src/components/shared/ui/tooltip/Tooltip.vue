<script setup lang="ts">
/**
 * Elegant glassy tooltip that replaces the native `title` attribute.
 *
 * Wraps a trigger (default slot) and shows a borderless frosted-glass panel
 * with the given text on hover/focus — but only after a dwell of `showDelay`
 * (1s by default). The dwell is a pure CSS transition-delay on the panel, so
 * there is no timer in script: leaving the trigger before the delay elapses
 * cancels the reveal and a passing swipe never flashes a tooltip.
 *
 * The panel mirrors the floating player's glassy tone — a translucent
 * elevated surface at a 50% fill over a 0.75rem backdrop blur, with no frame —
 * so it reads as part of the same design language as the playlist and
 * new-conversation surfaces.
 *
 * The wrapper is `display: contents`, so it never creates a box of its own and
 * cannot change the layout of the parent (a flex/grid container keeps sizing
 * the trigger exactly as if the tooltip weren't there). The panel is
 * `position: fixed` and placed with JS relative to the trigger's bounding
 * box, so it floats above the page without affecting any surrounding layout.
 */
import { useTooltip } from './composables/use-tooltip';
import type { TooltipProps } from './Tooltip.types';

const props = withDefaults(defineProps<TooltipProps>(), {
  positions: () => ['top'],
  disabled: false,
  showDelay: '1s',
});

const { isVisible, panelStyle, showTooltip, hideTooltip } = useTooltip(props);
</script>

<template>
  <span
    ref="wrapperRef"
    class="tooltip"
    :data-tooltip-disabled="disabled || undefined"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focusin="showTooltip"
    @focusout="hideTooltip"
  >
    <slot />
    <Teleport to="body">
      <span
        v-if="!disabled && (text || $slots.content)"
        ref="panelRef"
        class="tooltip__panel"
        :class="{
          'tooltip__panel--visible': isVisible,
          'tooltip__panel--wrap': maxWidth !== undefined,
        }"
        role="tooltip"
        aria-hidden="true"
        :style="[
          panelStyle,
          maxWidth ? { maxWidth } : null,
          { '--tooltip-show-delay': showDelay },
        ]"
      >
        <!-- Rich tooltip content (e.g. title + description + caption). Falls
             back to the plain `text` prop when no content slot is given. -->
        <slot name="content">{{ text }}</slot>
      </span>
    </Teleport>
  </span>
</template>

<style scoped>
/* `display: contents` removes the wrapper's box entirely, so the trigger
   participates in the parent layout exactly as if the tooltip weren't there
   (no extra flex item, no width change). */
.tooltip {
  display: contents;
}

/* Borderless frosted glass in the floating player's recipe: a translucent
   elevated surface with no frame, a 50% fill of the secondary background, and
   a 0.75rem backdrop blur (prefixed variant for older iOS Safari), so the
   panel reads as dark frosted glass over whatever sits beneath. Teleported to
   <body> so it escapes any ancestor stacking context (e.g. a `transform` on
   the trigger's container) and always floats above the page. `position: fixed`
   keeps it out of flow so it never affects surrounding layout. */
.tooltip__panel {
  position: fixed;
  /* Above the tab-menu drawer (1200) and floating playlist (1250) so a
     tooltip never hides behind them; below the toast layer (9999). */
  z-index: 1300;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
  color: var(--color-fg-secondary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.5s ease,
    visibility 0s linear 0.5s;
}

/* The dwell delay lives on the visible state only: appearing waits for
   --tooltip-show-delay (bound inline per usage, 1s by default), while
   disappearing stays immediate via the base rule above. Leaving the trigger
   before the delay elapses swaps back to the base transition, which cancels
   the pending reveal — pure-CSS hover intent with no script timer. */
.tooltip__panel--visible {
  opacity: 0.85;
  visibility: visible;
  transition:
    opacity 0.5s ease var(--tooltip-show-delay),
    visibility 0s linear var(--tooltip-show-delay);
}

/* Wrapping mode: allow long text to wrap and break mid-word, bounded by the
   caller-supplied max-width (kept to a reasonable size so the tooltip never
   spans the whole viewport). */
.tooltip__panel--wrap {
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
