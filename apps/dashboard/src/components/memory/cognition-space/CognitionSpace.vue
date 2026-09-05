<script setup lang="ts">
/**
 * The cognition constellation: the AI's understanding of the user — the
 * profile hub plus path-grouped insights. Refresh + armed two-click wipe
 * preserved from the old text panel, plus the shared view controls (labels,
 * expand/collapse all, reset, rotation).
 */
import { Fingerprint } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import { useConstellationView } from '../composables/use-constellation-view';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { useCognitionSpace } from './composables/use-cognition-space';

const {
  nodes,
  links,
  frictions,
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
  'cognition',
  frictions,
);
</script>

<template>
  <MemorySpacePanel
    :icon="Fingerprint"
    :label="$t('common.memoryCognition')"
    :description="$t('common.memoryCognitionDesc')"
    :nodes="visibleNodes"
    :links="visibleLinks"
    :frictions="visibleFrictions"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryCognitionUnavailable')"
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
        :refresh-title="$t('common.memoryCognitionRefresh')"
        :is-refresh-disabled="isLoading"
        :show-labels="showLabels"
        :rotation-enabled="rotationEnabled"
        :is-all-expanded="isAllExpanded"
        :strict-mode="strictMode"
        :show-suggested="showSuggested"
        :wipe-title="$t('common.memoryCognitionWipe')"
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
