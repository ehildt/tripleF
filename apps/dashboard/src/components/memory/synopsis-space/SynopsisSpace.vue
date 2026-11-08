<script setup lang="ts">
/**
 * The synopsis tab: the Raptor cluster hierarchy of one scope, rendered as
 * a collapsible tree (rows collapsed by default — heads only — summaries and
 * children open on demand). Scope toggle switches between the shared
 * encyclopedia and the user's partition. The tree, not a canvas: clustering
 * output is for reading, and a nested list keeps every summary legible
 * instead of squeezing it onto a binary-tree canvas.
 */
import { Brain, Layers, Network, RefreshCw } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';

import SpaceHeader from '../shared/ui/space-header/SpaceHeader.vue';
import { useSynopsisSpace } from './composables/use-synopsis-space';
import SynopsisTree from './synopsis-tree/SynopsisTree.vue';

const { scope, isLoading, isUnavailable, isEmpty, refresh, setScope } =
  useSynopsisSpace();

const { memoryPartition } = storeToRefs(useMemorySpacesStore());

/** Refetch when the active partition changes while the tab is mounted. */
const partitionKey = computed(() => memoryPartition.value.trim() || 'default');

onMounted(refresh);
watch(partitionKey, refresh);
</script>

<template>
  <div class="synopsis-space">
    <SpaceHeader
      :icon="Layers"
      :label="$t('common.memorySynopsisTitle')"
      :description="$t('common.memorySynopsisDesc')"
    >
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
    </SpaceHeader>

    <div v-if="isUnavailable" class="synopsis-space__state">
      {{ $t('common.memorySynopsisUnavailable') }}
    </div>
    <div
      v-if="!isUnavailable && isEmpty && !isLoading"
      class="synopsis-space__state"
    >
      {{ $t('common.memorySynopsisEmpty') }}
    </div>

    <SynopsisTree v-if="!isUnavailable && !isEmpty" />
  </div>
</template>

<style scoped>
.synopsis-space {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.synopsis-space__state {
  padding: var(--spacing-6) var(--spacing-3);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  text-align: center;
}
</style>
