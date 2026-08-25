<script setup lang="ts">
/**
 * The cognition constellation: the AI's understanding of the user — the
 * profile hub plus path-clustered insights. Refresh + armed two-click wipe
 * preserved from the old text panel, plus the shared view controls (labels,
 * expand/collapse all, reset, rotation).
 */
import { Fingerprint } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { useCognitionSpace } from './composables/use-cognition-space';

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
} = useCognitionSpace();

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
    :icon="Fingerprint"
    :label="$t('common.memoryCognition')"
    :description="$t('common.memoryCognitionDesc')"
    :nodes="nodes"
    :links="links"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryCognitionUnavailable')"
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
        :refresh-title="$t('common.memoryCognitionRefresh')"
        :is-refresh-disabled="isLoading"
        :show-labels="showLabels"
        :rotation-enabled="rotationEnabled"
        :is-all-expanded="isAllExpanded"
        :wipe-title="$t('common.memoryCognitionWipe')"
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
