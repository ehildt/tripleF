<script setup lang="ts">
/**
 * The synopsis tab: the Raptor cluster hierarchy of one scope, rendered as
 * a collapsible tree (root rows open by default, deeper levels folded).
 * Scope toggle switches between the shared encyclopedia and the user's
 * partition. The tree, not a canvas: clustering output is for reading, and
 * a nested list keeps every summary legible instead of squeezing it onto a
 * binary-tree canvas.
 */
import { Brain, Layers, Network, RefreshCw } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import { useAppStore } from '@/stores/app';

import { useSynopsisSpace } from './composables/use-synopsis-space';
import SynopsisTree from './synopsis-tree/SynopsisTree.vue';

const { scope, isLoading, isUnavailable, isEmpty, refresh, setScope } =
  useSynopsisSpace();

const { memoryPartition } = storeToRefs(useAppStore());

/** Refetch when the active partition changes while the tab is mounted. */
const partitionKey = computed(() => memoryPartition.value.trim() || 'default');

onMounted(refresh);
watch(partitionKey, refresh);
</script>

<template>
  <div class="synopsis-space">
    <div class="synopsis-space__header">
      <div class="synopsis-space__icon">
        <Layers class="synopsis-space__icon-glyph" />
      </div>
      <div class="synopsis-space__content">
        <span class="synopsis-space__label">
          {{ $t('common.memorySynopsisTitle') }}
        </span>
        <span class="synopsis-space__description">
          {{ $t('common.memorySynopsisDesc') }}
        </span>
      </div>
      <div class="synopsis-space__actions">
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
      </div>
    </div>

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

.synopsis-space__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.synopsis-space__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.synopsis-space__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.synopsis-space__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.synopsis-space__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.synopsis-space__description {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.synopsis-space__actions {
  display: flex;
  align-items: center;
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
