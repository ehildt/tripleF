<script setup lang="ts">
/**
 * The synopsis canvas: the Raptor cluster hierarchy of one scope, rendered
 * as a deterministic banded tree (leaf clusters at the bottom, root at the
 * top, parent links upward). Scope toggle switches between the shared
 * encyclopedia and the user's partition; drag pans, scroll zooms, hovering
 * a dot shows its community summary. Reuses the app's proven 2D-canvas
 * approach — no force simulation, the layout is deterministic.
 */
import { Brain, Layers, Network, RefreshCw } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import { useAppStore } from '@/stores/app';

import { useSynopsisCanvas } from './composables/use-synopsis-canvas';
import { useSynopsisSpace } from './composables/use-synopsis-space';

const {
  scope,
  nodes,
  links,
  isLoading,
  isUnavailable,
  isEmpty,
  refresh,
  setScope,
} = useSynopsisSpace();

const { memoryPartition } = storeToRefs(useAppStore());

const canvasRef = ref<HTMLCanvasElement | null>(null);

/** Theme colors for the canvas painter (resolved once from CSS vars). */
const colors = ref({ accent: '#f2b01e', muted: '#94a3b8' });

const {
  hoveredNode,
  tooltipStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
} = useSynopsisCanvas(nodes, links, canvasRef, colors);

onMounted(() => {
  const style = getComputedStyle(document.documentElement);
  colors.value = {
    accent:
      style.getPropertyValue('--color-accent').trim() || colors.value.accent,
    muted:
      style.getPropertyValue('--color-fg-muted').trim() || colors.value.muted,
  };
});
</script>

<template>
  <div class="synopsis-space">
    <div class="synopsis-space__header">
      <div class="synopsis-space__icon">
        <Layers class="synopsis-space__icon-glyph" />
      </div>
      <div class="synopsis-space__content">
        <span class="synopsis-space__label">
          {{ $t('common.memorySynopsisTitle') }}
        </span>
        <span class="synopsis-space__description">
          {{ $t('common.memorySynopsisDesc') }}
        </span>
      </div>
      <div class="synopsis-space__actions">
        <IconButton
          :title="$t('common.memorySynopsisScopeEncyclopedia')"
          :active="scope === 'encyclopedia'"
          size="sm"
          @click="setScope('encyclopedia')"
        >
          <Network />
        </IconButton>
        <IconButton
          :title="
            $t('common.memorySynopsisScopePartition') +
            ` (${memoryPartition.trim() || 'default'})`
          "
          :active="scope === 'partition'"
          size="sm"
          @click="setScope('partition')"
        >
          <Brain />
        </IconButton>
        <IconButton
          :title="$t('common.memorySynopsisRefresh')"
          :disabled="isLoading"
          size="sm"
          @click="refresh"
        >
          <RefreshCw />
        </IconButton>
      </div>
    </div>

    <div v-if="isUnavailable" class="synopsis-space__state">
      {{ $t('common.memorySynopsisUnavailable') }}
    </div>
    <div v-else-if="isEmpty && !isLoading" class="synopsis-space__state">
      {{ $t('common.memorySynopsisEmpty') }}
    </div>
    <div v-else class="synopsis-space__canvas">
      <canvas
        ref="canvasRef"
        class="synopsis-space__canvas-el"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @wheel="onWheel"
      />
      <div
        v-show="hoveredNode"
        class="synopsis-space__tooltip"
        :style="tooltipStyle"
      >
        <span class="synopsis-space__tooltip-title">{{
          hoveredNode?.title
        }}</span>
        <span class="synopsis-space__tooltip-meta">
          {{ $t('common.memorySynopsisLevelLabel') }} {{ hoveredNode?.level }} ·
          {{ $t('common.memorySynopsisMembersLabel') }}
          {{ hoveredNode?.memberCount }}
        </span>
        <span class="synopsis-space__tooltip-summary">{{
          hoveredNode?.summary
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.synopsis-space {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.synopsis-space__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.synopsis-space__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.synopsis-space__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.synopsis-space__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.synopsis-space__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.synopsis-space__description {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.synopsis-space__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.synopsis-space__state {
  padding: var(--spacing-6) var(--spacing-3);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  text-align: center;
}

.synopsis-space__canvas {
  position: relative;
  height: 32rem;
  background-color: var(--color-bg-secondary);
  overflow: hidden;
}

.synopsis-space__canvas-el {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}

.synopsis-space__tooltip {
  position: absolute;
  z-index: 10;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  pointer-events: none;
}

.synopsis-space__tooltip-title {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.synopsis-space__tooltip-meta {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-fg-muted);
}

.synopsis-space__tooltip-summary {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}
</style>
