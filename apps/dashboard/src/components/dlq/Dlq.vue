<script setup lang="ts">
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';

import { useModelsStore } from '../../stores/models/models.store';
import { useDlqConversationPresence } from './composables/use-dlq-conversation-presence';
import { useDlqEntries } from './composables/use-dlq-entries';
import { useDlqQueryState } from './composables/use-dlq-query-state';
import DlqDetailsBody from './dlq-details-body/DlqDetailsBody.vue';
import DlqListBody from './dlq-list-body/DlqListBody.vue';
import DlqListHeader from './dlq-list-header/DlqListHeader.vue';
import { getDlqEntryReadKey } from './helpers/get-dlq-entry-read-key.helper';

const modelsStore = useModelsStore();
const {
  filterSearch,
  filterStatus,
  hideRead,
  limit,
  offset,
  setPage,
  setPageSize,
  nextPage,
  prevPage,
} = useDlqQueryState();
const {
  entries,
  selectedEntry,
  total,
  currentPage,
  totalPages,
  errorMessage,
  loading,
  actions,
  readState,
} = useDlqEntries();
const { showLoading, guardedRefetch } = loading;
const { isConversationDeleted } = useDlqConversationPresence();
</script>

<template>
  <div class="dlq-column">
    <PanelLayout class="dlq-column__panel">
      <DlqListHeader
        v-model:filter-search="filterSearch"
        :show-loading="showLoading"
        :filter-status="filterStatus"
        :hide-read="hideRead"
        :total="total"
        :current-page="currentPage"
        :total-pages="totalPages"
        :limit="limit"
        :offset="offset"
        @reload="guardedRefetch"
        @update:filter-status="(value) => (filterStatus = value)"
        @update:hide-read="(value) => (hideRead = value)"
        @first-page="setPage(1)"
        @prev-page="prevPage"
        @next-page="nextPage(total)"
        @last-page="setPage(totalPages)"
        @set-page="setPage"
        @set-page-size="setPageSize"
      />
      <DlqListBody
        :entries="entries"
        :selected-entry-id="selectedEntry?.id ?? null"
        :error="errorMessage"
        :hide-read="hideRead"
        :is-entry-read="readState.isEntryRead"
        :entry-read-key="getDlqEntryReadKey"
        :is-conversation-deleted="isConversationDeleted"
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
      :entry="selectedEntry"
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
