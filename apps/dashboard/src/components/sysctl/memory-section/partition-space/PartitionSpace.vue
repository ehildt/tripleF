<script setup lang="ts">
/**
 * The partition constellation: the user's stored fact records, clustered by
 * topic tag. Refresh + armed two-click wipe preserved from the old text
 * panel, plus the shared view controls (labels, expand/collapse all, reset,
 * rotation).
 */
import { Brain } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { usePartitionSpace } from './composables/use-partition-space';

const {
  nodes,
  links,
  isLoading,
  isUnavailable,
  isEmpty,
  refresh,
  wipeArmed,
  handleWipeClick,
  storageKey,
} = usePartitionSpace();

const {
  showLabels,
  rotationEnabled,
  resetSignal,
  isAllExpanded,
  toggleAllSignal,
  toggleLabels,
  toggleRotation,
  resetView,
  toggleAllClusters,
  setAllExpanded,
} = useConstellationControls();
</script>

<template>
  <MemorySpacePanel
    :icon="Brain"
    :label="$t('common.memoryPartitionFacts')"
    :description="$t('common.memoryPartitionFactsDesc')"
    :nodes="nodes"
    :links="links"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryPartitionUnavailable')"
    :show-labels="showLabels"
    :rotation-enabled="rotationEnabled"
    :reset-signal="resetSignal"
    :is-all-expanded="isAllExpanded"
    :toggle-all-signal="toggleAllSignal"
    :storage-key="storageKey"
    @expanded-state-change="setAllExpanded"
  >
    <template #actions>
      <ConstellationToolbar
        :refresh-title="$t('common.memoryPartitionRefresh')"
        :is-refresh-disabled="isLoading"
        :show-labels="showLabels"
        :rotation-enabled="rotationEnabled"
        :is-all-expanded="isAllExpanded"
        :wipe-title="$t('common.memoryPartitionWipe')"
        :wipe-armed="wipeArmed"
        :is-wipe-disabled="isLoading || isEmpty"
        @refresh="refresh"
        @toggle-labels="toggleLabels"
        @toggle-rotation="toggleRotation"
        @toggle-all-clusters="toggleAllClusters"
        @reset-view="resetView"
        @wipe="handleWipeClick"
      />
    </template>
  </MemorySpacePanel>
</template>
