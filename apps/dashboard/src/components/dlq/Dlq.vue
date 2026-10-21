<script setup lang="ts">
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';

import { useDlqStore } from '../../stores/dlq';
import { useModelsStore } from '../../stores/models';
import { useDlqEntries } from './composables/use-dlq-entries';
import DlqDetailsBody from './dlq-details-body/DlqDetailsBody.vue';
import DlqListBody from './dlq-list-body/DlqListBody.vue';
import DlqListHeader from './dlq-list-header/DlqListHeader.vue';

const dlqStore = useDlqStore();
const modelsStore = useModelsStore();

// Entries lifecycle (query, loading spinner, store sync, refetch watchers)
// and the row/detail actions composed onto it — see use-dlq-entries.
const { showLoading, guardedRefetch, actions } = useDlqEntries();
</script>

<template>
  <div class="dlq-column">
    <PanelLayout class="dlq-column__panel">
      <DlqListHeader
        :show-loading="showLoading"
        :filter-status="dlqStore.filterStatus"
        :filter-search="dlqStore.filterSearch"
        :hide-read="dlqStore.hideRead"
        :total="dlqStore.total"
        :current-page="dlqStore.currentPage"
        :total-pages="dlqStore.totalPages"
        :limit="dlqStore.limit"
        :offset="dlqStore.offset"
        @reload="guardedRefetch"
        @update:filter-status="(value) => (dlqStore.filterStatus = value)"
        @update:filter-search="(value) => (dlqStore.filterSearch = value)"
        @update:hide-read="(value) => (dlqStore.hideRead = value)"
        @first-page="dlqStore.setPage(1)"
        @prev-page="dlqStore.prevPage"
        @next-page="dlqStore.nextPage"
        @last-page="dlqStore.setPage(dlqStore.totalPages)"
        @set-page="dlqStore.setPage"
        @set-page-size="dlqStore.setPageSize"
      />
      <DlqListBody
        :entries="dlqStore.entries"
        :selected-entry-id="dlqStore.selectedEntry?.id ?? null"
        :error="dlqStore.error"
        :hide-read="dlqStore.hideRead"
        :is-entry-read="(entry) => dlqStore.isEntryRead(entry)"
        :entry-read-key="(entry) => dlqStore.entryReadKey(entry)"
        @select="actions.onSelect"
        @retry="actions.onRetry"
        @archive="actions.onArchive"
        @delete="actions.onDelete"
      />
    </PanelLayout>
  </div>

  <div class="dlq-column">
    <DlqDetailsBody
      class="dlq-column__panel"
      :entry="dlqStore.selectedEntry"
      :models="modelsStore.modelNames"
      @save-payload="actions.onSavePayload"
    />
  </div>
</template>

<style scoped>
/* Jobs and Details share one viewport-derived height on desktop so both
   panels always line up; each panel scrolls its own body internally. */
@media (min-width: 1024px) {
  .dlq-column {
    grid-column: span 6 / span 6;
    position: sticky;
    top: 6rem;
    max-height: calc(100vh - 10rem);
  }

  .dlq-column__panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
}
</style>
