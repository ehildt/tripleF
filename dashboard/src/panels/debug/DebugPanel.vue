<script setup lang="ts">
import { computed, ref } from 'vue';

import type { DebugResult } from '../../types/debug.model';
import DebugPanelEmptyState from './DebugPanel.EmptyState.vue';
import DebugPanelHeaderMenu from './DebugPanel.Header.Menu.vue';
import DebugPanelHeaderTitle from './DebugPanel.Header.Title.vue';
import DebugPanelHeader from './DebugPanel.Header.vue';
import DebugPanelLayout from './DebugPanel.Layout.vue';
import DebugPanelResults from './DebugPanel.Results.vue';

const props = defineProps<{
  results: DebugResult[];
  selectedResult: DebugResult | null;
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
  (e: 'select', result: DebugResult | null): void;
}>();

const filter = ref<'all' | 'http' | 'socket'>('all');

const filteredResults = computed(() => {
  if (filter.value === 'all') return props.results;
  return props.results.filter((r) => r.type === filter.value);
});

const httpCount = computed(
  () => props.results.filter((r) => r.type === 'http').length,
);

const socketCount = computed(
  () => props.results.filter((r) => r.type === 'socket').length,
);

function select(result: DebugResult) {
  const newSelection = props.selectedResult?.id === result.id ? null : result;
  emit('select', newSelection);
}
</script>

<template>
  <DebugPanelLayout class="min-h-50">
    <DebugPanelHeader>
      <DebugPanelHeaderTitle label="Request Log" />
      <DebugPanelHeaderMenu
        :filter="filter"
        :all-count="results.length"
        :http-count="httpCount"
        :socket-count="socketCount"
        @update:filter="filter = $event"
        @clear="$emit('clear')"
      />
    </DebugPanelHeader>
    <DebugPanelResults
      v-if="filteredResults.length"
      :results="filteredResults"
      :selected-result-id="selectedResult?.id!"
      @select="select"
    />
    <DebugPanelEmptyState v-else />
  </DebugPanelLayout>
</template>
