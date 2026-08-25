<script setup lang="ts">
/**
 * The lexicon constellation: the shared knowledge cache (verbatim chunks of
 * fetched web content), clustered by source domain. Read-only — refresh only,
 * plus the shared view controls (labels, expand/collapse all, reset,
 * rotation).
 */
import { Network } from '@lucide/vue';

import { useConstellationControls } from '../composables/use-constellation-controls';
import ConstellationToolbar from '../memory-space-panel/constellation-toolbar/ConstellationToolbar.vue';
import MemorySpacePanel from '../memory-space-panel/MemorySpacePanel.vue';
import { useLexiconSpace } from './composables/use-lexicon-space';

const { nodes, links, isLoading, isUnavailable, refresh, storageKey } =
  useLexiconSpace();

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
    :icon="Network"
    :label="$t('common.memoryLexicon')"
    :description="$t('common.memoryLexiconDesc')"
    :nodes="nodes"
    :links="links"
    :is-loading="isLoading"
    :is-unavailable="isUnavailable"
    :unavailable-text="$t('common.memoryLexiconUnavailable')"
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
        :refresh-title="$t('common.memoryLexiconRefresh')"
        :is-refresh-disabled="isLoading"
        :show-labels="showLabels"
        :rotation-enabled="rotationEnabled"
        :is-all-expanded="isAllExpanded"
        @refresh="refresh"
        @toggle-labels="toggleLabels"
        @toggle-rotation="toggleRotation"
        @toggle-all-clusters="toggleAllClusters"
        @reset-view="resetView"
      />
    </template>
  </MemorySpacePanel>
</template>
