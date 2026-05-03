<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useDebugStore } from '../../stores/debug';
import type { DebugResult } from '../../types/debug.model';
import PanelEmptyState from '../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import RequestList from './request-list/RequestList.vue';
import HeaderMenu from './shared/ui/header-menu/HeaderMenu.vue';

export type ResultFilter = 'all' | 'http' | 'socket';

const props = defineProps<{
  results: DebugResult[];
  selectedResult: DebugResult | null;
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
  (e: 'select', result: DebugResult | null): void;
  (e: 'markRead', id: string): void;
}>();

const debugStore = useDebugStore();

/** Composable-local state: the active type filter and hide-read flag. */
const filter = ref<ResultFilter>('all');
const hideRead = ref(false);

const filteredResults = ref<DebugResult[]>([]);

function recomputeFilter() {
  let results = props.results;
  if (filter.value !== 'all') {
    results = results.filter((r) => r.type === filter.value);
  }
  if (hideRead.value) {
    results = results.filter((r) => !debugStore.isDebugRead(r.id));
  }
  filteredResults.value = [...results].sort((a, b) => {
    const aRead = debugStore.isDebugRead(a.id);
    const bRead = debugStore.isDebugRead(b.id);
    if (aRead !== bRead) return aRead ? 1 : -1;
    return (b.epoch ?? 0) - (a.epoch ?? 0);
  });
}

const hasHiddenRead = ref(false);

function recomputeHasHiddenRead() {
  hasHiddenRead.value =
    hideRead.value && props.results.some((r) => debugStore.isDebugRead(r.id));
}

watch(
  () => props.results,
  () => {
    recomputeFilter();
    recomputeHasHiddenRead();
  },
  { immediate: true },
);
watch(filter, recomputeFilter);
watch(filter, recomputeHasHiddenRead);
watch(hideRead, recomputeFilter);
watch(hideRead, recomputeHasHiddenRead);

const httpCount = computed(
  () => props.results.filter((r) => r.type === 'http').length,
);

const socketCount = computed(
  () => props.results.filter((r) => r.type === 'socket').length,
);

function select(result: DebugResult) {
  emit('markRead', result.id);
  const isSame = props.selectedResult?.id === result.id;
  emit('select', isSame ? null : result);
}
</script>

<template>
  <PanelLayout>
    <PanelHeader>
      <PanelHeaderTitle label="Request Log" />
      <HeaderMenu
        :filter="filter"
        :all-count="results.length"
        :http-count="httpCount"
        :socket-count="socketCount"
        :hide-read="hideRead"
        @update:filter="filter = $event"
        @update:hide-read="hideRead = $event"
        @clear="$emit('clear')"
      />
    </PanelHeader>
    <RequestList
      v-if="filteredResults.length"
      :results="filteredResults"
      :selected-result-id="selectedResult?.id"
      :is-read="debugStore.isDebugRead"
      @select="select"
    />
    <PanelEmptyState
      v-else-if="results.length === 0"
      message="No requests yet"
      submessage="Send a request to see results"
    />
    <PanelEmptyState
      v-else-if="hasHiddenRead"
      message="No unread requests"
      submessage="Toggle the eye icon to show all requests"
    />
    <PanelEmptyState
      v-else
      message="No matching requests"
      submessage="Change filter to see other requests"
    />
  </PanelLayout>
</template>
