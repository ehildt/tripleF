<script setup lang="ts">
/**
 * Eight-direction resize handles for fixed-position floating surfaces.
 * Pointer events are captured by the parent via the pointerdown event.
 */
import type { ResizeDirection } from '@/types/resize-direction.model';

defineProps<{
  directions?: ResizeDirection[];
}>();

const emit = defineEmits<{
  (e: 'resize', direction: ResizeDirection, event: PointerEvent): void;
}>();

const RESIZE_DIRECTIONS: ResizeDirection[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

function handlePointerDown(
  direction: ResizeDirection,
  event: PointerEvent,
): void {
  emit('resize', direction, event);
}
</script>

<template>
  <span
    v-for="direction in directions ?? RESIZE_DIRECTIONS"
    :key="direction"
    class="resize-handle-grid__handle"
    :class="`resize-handle-grid__handle--${direction}`"
    aria-hidden="true"
    @pointerdown="handlePointerDown(direction, $event)"
  />
</template>

<style scoped>
.resize-handle-grid__handle {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.resize-handle-grid__handle--n,
.resize-handle-grid__handle--s {
  left: 1rem;
  right: 1rem;
  height: 0.5rem;
  cursor: ns-resize;
}

.resize-handle-grid__handle--n {
  top: -0.25rem;
}

.resize-handle-grid__handle--s {
  bottom: -0.25rem;
}

.resize-handle-grid__handle--e,
.resize-handle-grid__handle--w {
  top: 1rem;
  bottom: 1rem;
  width: 0.5rem;
  cursor: ew-resize;
}

.resize-handle-grid__handle--e {
  right: -0.25rem;
}

.resize-handle-grid__handle--w {
  left: -0.25rem;
}

.resize-handle-grid__handle--ne,
.resize-handle-grid__handle--nw,
.resize-handle-grid__handle--se,
.resize-handle-grid__handle--sw {
  width: 1rem;
  height: 1rem;
}

.resize-handle-grid__handle--ne {
  top: -0.25rem;
  right: -0.25rem;
  cursor: nesw-resize;
}

.resize-handle-grid__handle--nw {
  top: -0.25rem;
  left: -0.25rem;
  cursor: nwse-resize;
}

.resize-handle-grid__handle--se {
  bottom: -0.25rem;
  right: -0.25rem;
  cursor: nwse-resize;
}

.resize-handle-grid__handle--sw {
  bottom: -0.25rem;
  left: -0.25rem;
  cursor: nesw-resize;
}
</style>
