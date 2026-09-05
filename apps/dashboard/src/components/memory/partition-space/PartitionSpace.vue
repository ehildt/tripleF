<script setup lang="ts">
/**
 * The partition constellation: the user's stored fact records, grouped by
 * topic tag. Refresh + armed two-click wipe preserved from the old text
 * panel, plus the shared view controls (labels, expand/collapse all, reset,
 * rotation).
 */
import { Brain } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import { useConstellationView } from '../composables/use-constellation-view';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { usePartitionSpace } from './composables/use-partition-space';

const {
  nodes,
  links,
  frictions,
  clusters,
  labelMeta,
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
  strictMode,
  toggleLabels,
  toggleRotation,
  resetView,
  toggleAllTopics,
  setAllExpanded,
  toggleStrictMode,
  showSuggested,
  toggleSuggested,
} = useConstellationControls();

const { visibleNodes, visibleLinks, visibleFrictions } = useConstellationView(
  nodes,
  links,
  strictMode,
  'partition',
  frictions,
);
</script>

<template>
  <MemorySpacePanel
    :icon="Brain"
    :label="$t('common.memoryPartitionFacts')"
    :description="$t('common.memoryPartitionFactsDesc')"
    :nodes="visibleNodes"
    :links="visibleLinks"
    :frictions="visibleFrictions"
    :clusters="clusters"
    :label-meta="labelMeta"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryPartitionUnavailable')"
    :show-labels="showLabels"
    :show-suggested="showSuggested"
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
        :strict-mode="strictMode"
        :show-suggested="showSuggested"
        :wipe-title="$t('common.memoryPartitionWipe')"
        :wipe-armed="wipeArmed"
        :is-wipe-disabled="isLoading || isEmpty"
        @refresh="refresh"
        @toggle-labels="toggleLabels"
        @toggle-rotation="toggleRotation"
        @toggle-all-topics="toggleAllTopics"
        @toggle-strict-mode="toggleStrictMode"
        @toggle-suggested="toggleSuggested"
        @reset-view="resetView"
        @wipe="handleWipeClick"
      />
    </template>
  </MemorySpacePanel>
</template>
