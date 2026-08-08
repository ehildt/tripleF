<script setup lang="ts">
/**
 * Elegant glassy tooltip that replaces the native `title` attribute.
 *
 * Wraps a trigger (default slot) and shows a borderless frosted-glass panel
 * with the given text on hover/focus. The panel mirrors the floating player's
 * glassy tone — a translucent elevated surface with a backdrop blur and no
 * frame — so it reads as part of the same design language as the playlist and
 * new-conversation surfaces.
 *
 * The wrapper is `display: contents`, so it never creates a box of its own and
 * cannot change the layout of the parent (a flex/grid container keeps sizing
 * the trigger exactly as if the tooltip weren't there). The panel is
 * `position: fixed` and placed with JS relative to the trigger's bounding
 * box, so it floats above the page without affecting any surrounding layout.
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

const props = withDefaults(
  defineProps<{
    /** Text shown inside the glassy panel. */
    text: string;
    /**
     * Allowed sides, in priority order. The first side with room in the
     * viewport is used; if none fit, the first entry is used anyway.
     */
    positions?: TooltipPosition[];
    /** When true, no panel is rendered. */
    disabled?: boolean;
  }>(),
  {
    positions: () => ['top'],
    disabled: false,
  },
);

const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
const panelRef = useTemplateRef<HTMLElement>('panelRef');
const visible = ref(false);
const panelStyle = ref<Record<string, string>>({});
const resolvedPosition = ref<TooltipPosition>('top');

/** The trigger is the first element child of the `display: contents` wrapper. */
function triggerElement(): Element | null {
  const wrapper = wrapperRef.value;
  if (!wrapper) return null;
  const child = wrapper.firstElementChild;
  // Accept any Element, not just HTMLElement: lucide icons render an <svg>
  // (an SVGElement), which is not an HTMLElement — rejecting it left icon
  // tooltips unpositioned at the top-left corner.
  return child instanceof Element ? child : null;
}

/** Position the fixed panel against the trigger's bounding box. */
function computePosition(position: TooltipPosition, tr: DOMRect, pr: DOMRect) {
  const gap = 6;
  let top = 0;
  let left = 0;
  switch (position) {
    case 'top':
      top = tr.top - pr.height - gap;
      left = tr.left + tr.width / 2 - pr.width / 2;
      break;
    case 'bottom':
      top = tr.bottom + gap;
      left = tr.left + tr.width / 2 - pr.width / 2;
      break;
    case 'left':
      top = tr.top + tr.height / 2 - pr.height / 2;
      left = tr.left - pr.width - gap;
      break;
    case 'right':
      top = tr.top + tr.height / 2 - pr.height / 2;
      left = tr.right + gap;
      break;
    case 'center':
      top = tr.top + tr.height / 2 - pr.height / 2;
      left = tr.left + tr.width / 2 - pr.width / 2;
      break;
  }
  return { top, left };
}

/** Whether the panel fits fully inside the viewport with a small margin. */
function fitsInViewport(top: number, left: number, pr: DOMRect): boolean {
  const margin = 4;
  return (
    top >= margin &&
    left >= margin &&
    top + pr.height <= window.innerHeight - margin &&
    left + pr.width <= window.innerWidth - margin
  );
}

/** Keep the panel inside the viewport even when no allowed side has room. */
function clampToViewport(top: number, left: number, pr: DOMRect) {
  const margin = 4;
  const maxTop = window.innerHeight - pr.height - margin;
  const maxLeft = window.innerWidth - pr.width - margin;
  return {
    top: Math.max(margin, Math.min(top, maxTop)),
    left: Math.max(margin, Math.min(left, maxLeft)),
  };
}

function updatePanelStyle() {
  const trigger = triggerElement();
  const panel = panelRef.value;
  if (!trigger || !panel) return;
  const tr = trigger.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();

  // Pick the first allowed side that has room; otherwise fall back to the
  // first allowed side. Either way, clamp so the panel never leaves the
  // viewport (e.g. a wide panel at the screen edge).
  let position = props.positions[0];
  let { top, left } = computePosition(position, tr, pr);
  for (const candidate of props.positions) {
    const pos = computePosition(candidate, tr, pr);
    if (fitsInViewport(pos.top, pos.left, pr)) {
      position = candidate;
      top = pos.top;
      left = pos.left;
      break;
    }
  }
  const clamped = clampToViewport(top, left, pr);
  panelStyle.value = { top: `${clamped.top}px`, left: `${clamped.left}px` };
  resolvedPosition.value = position;
}

function show() {
  if (props.disabled) return;
  visible.value = true;
  // Measure against the current layout immediately on show.
  updatePanelStyle();
}

function hide() {
  visible.value = false;
}

/** Keep a visible panel glued to its trigger across resize/scroll. */
function recomputePosition() {
  if (visible.value) updatePanelStyle();
}

onMounted(() => {
  window.addEventListener('resize', recomputePosition);
  // Capture phase catches scrolls in any scrollable container, not just the
  // window, so the panel follows the trigger wherever it moves.
  window.addEventListener('scroll', recomputePosition, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputePosition);
  window.removeEventListener('scroll', recomputePosition, true);
});
</script>

<template>
  <span
    ref="wrapperRef"
    class="tooltip"
    :class="`tooltip--${resolvedPosition}`"
    :data-tooltip-disabled="disabled || undefined"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @click.capture="hide"
  >
    <slot />
    <Teleport to="body">
      <span
        v-if="text && !disabled"
        ref="panelRef"
        class="tooltip__panel"
        :class="{ 'tooltip__panel--visible': visible }"
        role="tooltip"
        aria-hidden="true"
        :style="panelStyle"
      >
        {{ text }}
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

/* Borderless frosted glass, like the floating player: a translucent elevated
   surface with a backdrop blur and no frame. Teleported to <body> so it
   escapes any ancestor stacking context (e.g. a `transform` on the trigger's
   container) and always floats above the page. `position: fixed` keeps it out
   of flow so it never affects surrounding layout. Kept very transparent
   (≈10% fill) so the glassy/icy look reads clearly over content. */
.tooltip__panel {
  position: fixed;
  /* Above the tab-menu drawer (1200) and floating playlist (1250) so a
     tooltip never hides behind them; below the toast layer (9999). */
  z-index: 1300;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 10%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--color-fg-secondary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease,
    visibility 0s linear 0.15s;
}

.tooltip__panel--visible {
  opacity: 0.85;
  visibility: visible;
  transition: opacity 0.15s ease;
}
</style>
