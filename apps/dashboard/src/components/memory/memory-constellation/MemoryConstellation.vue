<script setup lang="ts">
/**
 * The memory-space canvas: a 3D point cloud rendered on a 2D canvas. Drag to
 * rotate, right-drag to pan, scroll to zoom, and click a leaf, node, hub,
 * cluster, or community to toggle its own interactive details popover.
 */
import { ref, toRef } from 'vue';

import { useMemoryConstellation } from './composables/use-memory-constellation';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './helpers/inter-link-min-score.constant';
import NodeDetailsPopover from './node-details-popover/NodeDetailsPopover.vue';
import type {
  MemoryConstellationEmits,
  MemoryConstellationProps,
} from './MemoryConstellation.types';

const props = withDefaults(defineProps<MemoryConstellationProps>(), {
  showLabels: true,
  showSuggested: true,
  showHeat: true,
  rotationEnabled: true,
  resetSignal: 0,
  interLinkMinScore: DEFAULT_INTER_LINK_MIN_SCORE,
  isAllExpanded: false,
  toggleAllSignal: 0,
  frictions: () => [],
  clusters: () => [],
});
const emit = defineEmits<MemoryConstellationEmits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const {
  detailsPanels,
  closeNodeDetails,
  closeLatestNodeDetails,
  startNodeDetailsDrag,
  setDetailsPopoverRef,
} = useMemoryConstellation(
  toRef(props, 'nodes'),
  toRef(props, 'links'),
  toRef(props, 'frictions'),
  toRef(props, 'clusters'),
  toRef(props, 'mainNodes'),
  toRef(props, 'labelMeta'),
  canvasRef,
  (isAllExpanded) => emit('expandedStateChange', isAllExpanded),
  {
    showLabels: toRef(props, 'showLabels'),
    showSuggested: toRef(props, 'showSuggested'),
    showHeat: toRef(props, 'showHeat'),
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
  <div class="memory-constellation" @keydown.esc="closeLatestNodeDetails">
    <canvas
      ref="canvasRef"
      class="memory-constellation__canvas"
      tabindex="0"
      :aria-label="$t('common.memoryConstellationHint')"
    />

    <NodeDetailsPopover
      v-for="panel in detailsPanels"
      :key="panel.node.id"
      :ref="(instance) => setDetailsPopoverRef(panel.node.id, instance)"
      :label="panel.node.label"
      :meta="panel.metaRows"
      :content-html="panel.contentHtml"
      :download-url="panel.node.downloadUrl"
      :evidence-texts="panel.node.evidenceTexts ?? []"
      :friction-reasons="panel.frictionReasons"
      :position="panel.position"
      @close="closeNodeDetails(panel.node.id)"
      @drag="startNodeDetailsDrag(panel.node.id, $event)"
    />

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
  height: clamp(36rem, 75vh, 55rem);
  overflow: hidden;
  background-color: transparent;
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

.memory-constellation__canvas:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
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
