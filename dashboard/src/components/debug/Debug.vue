<script setup lang="ts">
import { useDebugStore } from '../../stores/debug';
import type { DebugResult } from '../../types/debug.model';
import PanelEmptyState from '../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { useDebugFilters } from './composables/use-debug-filters.composable';
import RequestList from './request-list/RequestList.vue';
import HeaderMenu from './shared/ui/header-menu/HeaderMenu.vue';
import type { DebugProps } from './Debug.types';

const props = defineProps<DebugProps>();

const emit = defineEmits<{
  (e: 'clear'): void;
  (e: 'select', result: DebugResult | null): void;
  (e: 'markRead', id: string): void;
}>();

const debugStore = useDebugStore();

const {
  filter,
  search,
  hideRead,
  filteredResults,
  hasHiddenRead,
  httpCount,
  socketCount,
} = useDebugFilters(props);

function select(result: DebugResult) {
  emit('markRead', result.id);
  const isSame = props.selectedResult?.id === result.id;
  emit('select', isSame ? null : result);
}
</script>

<template>
  <PanelLayout>
    <PanelHeader>
      <PanelHeaderTitle :label="$t('common.requestLog')" />
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
      :message="$t('common.noRequestsYet')"
      :submessage="''"
    />
    <PanelEmptyState
      v-else-if="hasHiddenRead"
      :message="$t('common.noUnreadRequests')"
      :submessage="''"
    />
    <PanelEmptyState
      v-else
      :message="$t('common.noMatchingRequests')"
      :submessage="''"
    />
  </PanelLayout>
</template>
