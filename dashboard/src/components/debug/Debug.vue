<script setup lang="ts">
import { computed, ref } from 'vue';

import { useDebugStore } from '../../stores/debug';
import type { DebugResult } from '../../types/debug.model';
import PanelEmptyState from '../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import {
  buildFilteredDebugResults,
  type DebugResultFilter,
} from './helpers/build-filtered-debug-results.helper';
import RequestList from './request-list/RequestList.vue';
import HeaderMenu from './shared/ui/header-menu/HeaderMenu.vue';

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

/** Composable-local state: type filter, text search, and hide-read flag. */
const filter = ref<DebugResultFilter>('all');
const search = ref('');
const hideRead = ref(false);

const filteredResults = computed(() =>
  buildFilteredDebugResults(props.results, {
    filter: filter.value,
    hideRead: hideRead.value,
    search: search.value,
    isRead: debugStore.isDebugRead,
  }),
);

const hasHiddenRead = computed(
  () =>
    hideRead.value && props.results.some((r) => debugStore.isDebugRead(r.id)),
);

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
        :search="search"
        :all-count="results.length"
        :http-count="httpCount"
        :socket-count="socketCount"
        :hide-read="hideRead"
        @update:filter="filter = $event"
        @update:search="search = $event"
        @update:hide-read="hideRead = $event"
        @clear="emit('clear')"
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
      submessage="Change filter or search to see other requests"
    />
  </PanelLayout>
</template>
