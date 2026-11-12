<script setup lang="ts">
/**
 * Shared shell for the three memory-layer spaces: a shared header (icon +
 * label + description + actions slot), then either a state note
 * (unavailable / empty) or the full-width constellation canvas.
 */
import MemoryConstellation from '../memory-constellation/MemoryConstellation.vue';
import SpaceHeader from '../shared/ui/space-header/SpaceHeader.vue';
import type {
  MemorySpacePanelEmits,
  MemorySpacePanelProps,
} from './MemorySpacePanel.types';

defineProps<MemorySpacePanelProps>();
const emit = defineEmits<MemorySpacePanelEmits>();
</script>

<template>
  <div class="memory-space-panel">
    <SpaceHeader :icon="icon" :label="label" :description="description">
      <slot name="actions" />
    </SpaceHeader>

    <div v-if="isUnavailable" class="memory-space-panel__state">
      {{ unavailableText }}
    </div>
    <MemoryConstellation
      v-if="!isUnavailable"
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
      @expanded-state-change="emit('expandedStateChange', $event)"
    />
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
</style>
