<script setup lang="ts">
/**
 * The memory-space canvas: a 3D point cloud with x/y/z axes, rendered on a
 * 2D canvas via a perspective projection. Drag to rotate, right-drag to pan,
 * scroll to zoom, hover a dot for its full text, click a dot to select it.
 */
import { ref, toRef } from 'vue';

import { useMemoryConstellation } from './composables/use-memory-constellation';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './helpers/inter-link-min-score.constant';
import type {
  MemoryConstellationEmits,
  MemoryConstellationProps,
} from './MemoryConstellation.types';

const props = withDefaults(defineProps<MemoryConstellationProps>(), {
  showLabels: true,
  rotationEnabled: true,
  resetSignal: 0,
  interLinkMinScore: DEFAULT_INTER_LINK_MIN_SCORE,
  isAllExpanded: false,
  toggleAllSignal: 0,
});
const emit = defineEmits<MemoryConstellationEmits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const { hoveredNode, tooltipStyle } = useMemoryConstellation(
  toRef(props, 'nodes'),
  toRef(props, 'links'),
  canvasRef,
  tooltipRef,
  (node) => emit('nodeClick', node),
  (isAllExpanded) => emit('expandedStateChange', isAllExpanded),
  {
    showLabels: toRef(props, 'showLabels'),
    rotationEnabled: toRef(props, 'rotationEnabled'),
    resetSignal: toRef(props, 'resetSignal'),
    isAllExpanded: toRef(props, 'isAllExpanded'),
    toggleAllSignal: toRef(props, 'toggleAllSignal'),
    interLinkMinScore: toRef(props, 'interLinkMinScore'),
  },
  props.storageKey,
);
</script>

<template>
  <div class="memory-constellation">
    <canvas ref="canvasRef" class="memory-constellation__canvas" />

    <div
      v-show="hoveredNode"
      ref="tooltipRef"
      class="memory-constellation__tooltip"
      :style="tooltipStyle"
    >
      <template v-if="hoveredNode">
        <p class="memory-constellation__tooltip-text">
          {{ hoveredNode.summary ?? hoveredNode.text }}
        </p>
        <dl
          v-if="hoveredNode.meta?.length"
          class="memory-constellation__tooltip-meta"
        >
          <div
            v-for="row in hoveredNode.meta"
            :key="row.label"
            class="memory-constellation__tooltip-row"
          >
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </template>
    </div>

    <p class="memory-constellation__hint">
      {{ $t('common.memoryConstellationHint') }}
    </p>
  </div>
</template>

<style scoped>
.memory-constellation {
  position: relative;
  width: 100%;
  /* Fluid height: the canvas tracks its container via a ResizeObserver, so
     no pixel height is hardcoded here. */
  height: clamp(26rem, 65vh, 45rem);
  overflow: hidden;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.memory-constellation__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.memory-constellation__canvas:active {
  cursor: grabbing;
}

.memory-constellation__tooltip {
  position: absolute;
  z-index: 20;
  max-width: 22rem;
  padding: var(--spacing-2) var(--spacing-3);
  pointer-events: none;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 8px 24px
    color-mix(in srgb, var(--color-bg-primary) 35%, transparent);
  border-radius: var(--spacing-1);
}

.memory-constellation__tooltip-text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.memory-constellation__tooltip-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: var(--spacing-2) 0 0;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-divider);
}

.memory-constellation__tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.memory-constellation__tooltip-row dt {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.memory-constellation__tooltip-row dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.memory-constellation__hint {
  position: absolute;
  left: var(--spacing-3);
  bottom: var(--spacing-2);
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  pointer-events: none;
}
</style>
