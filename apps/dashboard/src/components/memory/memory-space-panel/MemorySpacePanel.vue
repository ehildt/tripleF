<script setup lang="ts">
/**
 * Shared shell for the three memory-layer spaces: a field-card-style header
 * (icon + label + description + action slot), then either a state note
 * (unavailable / empty) or the constellation canvas beside a collapsible
 * metadata column (5/6 canvas, 1/6 metadata).
 */
import { PanelRightClose, PanelRightOpen } from '@lucide/vue';
import { toRef } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import MemoryConstellation from '../memory-constellation/MemoryConstellation.vue';
import { useSpaceSelection } from './composables/use-space-selection';
import NodeMetadataColumn from './node-metadata-column/NodeMetadataColumn.vue';
import type {
  MemorySpacePanelEmits,
  MemorySpacePanelProps,
} from './MemorySpacePanel.types';

const props = defineProps<MemorySpacePanelProps>();
const emit = defineEmits<MemorySpacePanelEmits>();

const {
  selectedNode,
  selectedFrictions,
  metadataCollapsed,
  selectNode,
  toggleMetadata,
} = useSpaceSelection(props.storageKey, toRef(props, 'frictions'));
</script>

<template>
  <div class="memory-space-panel">
    <div class="memory-space-panel__header">
      <div class="memory-space-panel__icon">
        <component :is="icon" class="memory-space-panel__icon-glyph" />
      </div>
      <div class="memory-space-panel__content">
        <span class="memory-space-panel__label">{{ label }}</span>
        <span class="memory-space-panel__description">{{ description }}</span>
      </div>
      <div class="memory-space-panel__actions">
        <IconButton
          :title="
            metadataCollapsed
              ? $t('common.memoryMetadataShow')
              : $t('common.memoryMetadataHide')
          "
          :active="!metadataCollapsed"
          size="sm"
          @click="toggleMetadata"
        >
          <PanelRightOpen v-if="metadataCollapsed" />
          <PanelRightClose v-else />
        </IconButton>
        <slot name="actions" />
      </div>
    </div>

    <div v-if="isUnavailable" class="memory-space-panel__state">
      {{ unavailableText }}
    </div>
    <div v-else class="memory-space-panel__body">
      <div class="memory-space-panel__canvas">
        <MemoryConstellation
          :nodes="nodes"
          :links="links"
          :frictions="frictions"
          :clusters="clusters"
          :label-meta="labelMeta"
          :show-labels="showLabels"
          :show-suggested="showSuggested"
          :rotation-enabled="rotationEnabled"
          :reset-signal="resetSignal"
          :inter-link-min-score="interLinkMinScore"
          :is-all-expanded="isAllExpanded"
          :toggle-all-signal="toggleAllSignal"
          :storage-key="storageKey"
          @node-click="selectNode"
          @expanded-state-change="emit('expandedStateChange', $event)"
        />
      </div>
      <NodeMetadataColumn
        v-if="!metadataCollapsed"
        :node="selectedNode"
        :frictions="selectedFrictions"
        class="memory-space-panel__metadata"
      />
    </div>
  </div>
</template>

<style scoped>
.memory-space-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.memory-space-panel__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.memory-space-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.memory-space-panel__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.memory-space-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.memory-space-panel__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.memory-space-panel__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.memory-space-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.memory-space-panel__state {
  padding: var(--spacing-3);
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-style: italic;
  text-align: center;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

/* 6-column flex: 5 for the canvas, 1 for the metadata column. */
.memory-space-panel__body {
  display: flex;
  align-items: stretch;
}

.memory-space-panel__canvas {
  flex: 5 1 0%;
  min-width: 0;
}

.memory-space-panel__metadata {
  flex: 1 1 0%;
}
</style>
