<script setup lang="ts">
/**
 * Shared shell for the three memory-layer spaces: a shared header (icon +
 * label + description + actions slot), then either a state note
 * (unavailable / empty) or the constellation canvas beside a collapsible
 * metadata column (5/6 canvas, 1/6 metadata).
 */
import { PanelRightClose, PanelRightOpen } from '@lucide/vue';
import { toRef } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import MemoryConstellation from '../memory-constellation/MemoryConstellation.vue';
import SpaceHeader from '../shared/ui/space-header/SpaceHeader.vue';
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
  selectedTags,
  metadataCollapsed,
  selectNode,
  toggleMetadata,
} = useSpaceSelection(props.storageKey, toRef(props, 'frictions'));
</script>

<template>
  <div class="memory-space-panel">
    <SpaceHeader :icon="icon" :label="label" :description="description">
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
        <PanelRightClose v-if="!metadataCollapsed" />
      </IconButton>
      <slot name="actions" />
    </SpaceHeader>

    <div v-if="isUnavailable" class="memory-space-panel__state">
      {{ unavailableText }}
    </div>
    <div v-if="!isUnavailable" class="memory-space-panel__body">
      <MemoryConstellation
        class="memory-space-panel__canvas"
        :nodes="nodes"
        :links="links"
        :frictions="frictions"
        :clusters="clusters"
        :main-nodes="mainNodes"
        :label-meta="labelMeta"
        :show-labels="showLabels"
        :show-suggested="showSuggested"
        :show-heat="showHeat"
        :rotation-enabled="rotationEnabled"
        :reset-signal="resetSignal"
        :inter-link-min-score="interLinkMinScore"
        :is-all-expanded="isAllExpanded"
        :toggle-all-signal="toggleAllSignal"
        :storage-key="storageKey"
        @node-click="selectNode"
        @expanded-state-change="emit('expandedStateChange', $event)"
      />
      <NodeMetadataColumn
        v-if="!metadataCollapsed"
        :node="selectedNode"
        :frictions="selectedFrictions"
        :tags="selectedTags"
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
