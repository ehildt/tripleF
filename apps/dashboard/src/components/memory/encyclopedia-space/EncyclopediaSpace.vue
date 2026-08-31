<script setup lang="ts">
/**
 * The encyclopedia constellation: the shared knowledge cache (verbatim chunks of
 * fetched web content), grouped by category and topic. Read-only — refresh
 * only, plus the shared view controls (labels, expand/collapse all, reset,
 * rotation).
 */
import { Network } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import { useConstellationView } from '../composables/use-constellation-view';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { useEncyclopediaSpace } from './composables/use-encyclopedia-space';

const {
  nodes,
  links,
  frictions,
  clusters,
  isLoading,
  isUnavailable,
  refresh,
  storageKey,
} = useEncyclopediaSpace();

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
  'encyclopedia',
  frictions,
);
</script>

<template>
  <MemorySpacePanel
    :icon="Network"
    :label="$t('common.memoryEncyclopedia')"
    :description="$t('common.memoryEncyclopediaDesc')"
    :nodes="visibleNodes"
    :links="visibleLinks"
    :frictions="visibleFrictions"
    :clusters="clusters"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryEncyclopediaUnavailable')"
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
        :refresh-title="$t('common.memoryEncyclopediaRefresh')"
        :is-refresh-disabled="isLoading"
        :show-labels="showLabels"
        :rotation-enabled="rotationEnabled"
        :is-all-expanded="isAllExpanded"
        :strict-mode="strictMode"
        :show-suggested="showSuggested"
        @refresh="refresh"
        @toggle-labels="toggleLabels"
        @toggle-rotation="toggleRotation"
        @toggle-all-topics="toggleAllTopics"
        @toggle-strict-mode="toggleStrictMode"
        @toggle-suggested="toggleSuggested"
        @reset-view="resetView"
      />
    </template>
  </MemorySpacePanel>
</template>
