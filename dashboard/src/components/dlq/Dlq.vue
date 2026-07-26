<script setup lang="ts">
import { watch } from 'vue';

import { useDeleteDlqMutation } from '../../api/queries/use-delete-dlq-mutation';
import { useDlqQuery } from '../../api/queries/use-dlq-query';
import { useRetryDlqMutation } from '../../api/queries/use-retry-dlq-mutation';
import { useUpdateDlqMutation } from '../../api/queries/use-update-dlq-mutation';
import { useToast } from '../../composables/use-toast';
import { useDlqStore } from '../../stores/dlq';
import { useSocketStore } from '../../stores/socket';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { useDlqActions } from './composables/use-dlq-actions';
import { useDlqLoading } from './composables/use-dlq-loading';
import DlqDetailsBody from './details-body/DlqDetailsBody.vue';
import DlqListBody from './list-body/DlqListBody.vue';
import DlqListHeader from './list-header/DlqListHeader.vue';

const props = defineProps<{
  models: string[];
}>();

const dlqStore = useDlqStore();
const toast = useToast();
const socketStore = useSocketStore();

const {
  data: dlqData,
  error,
  isError,
  refetch,
} = useDlqQuery(() => dlqStore.getQueryParams());

const retryMutation = useRetryDlqMutation();
const deleteMutation = useDeleteDlqMutation();
const updateMutation = useUpdateDlqMutation();

const { showLoading, guardedRefetch, instantRefetch, onDataArrived, onError } =
  useDlqLoading({
    refetch,
  });

async function handleRefresh() {
  await guardedRefetch();
}

const { onSelect, onRetry, onArchive, onDelete, onSavePayload, onSaveQueue } =
  useDlqActions({
    dlqStore,
    socketStore: {
      ensureSocketConnection: socketStore.ensureSocketConnection,
      joinRoom: socketStore.joinRoom,
      listenToEvent: socketStore.listenToEvent,
      connectedEvents: socketStore.connectedEvents,
      connectedRooms: socketStore.connectedRooms,
    },
    retryMutation,
    deleteMutation,
    updateMutation,
    guardedRefetch,
  });

watch(dlqData, (val) => {
  if (val) {
    dlqStore.setEntries(val);
    onDataArrived();
  }
});

watch(isError, (val) => {
  if (val) {
    onError();
    dlqStore.error = error.value?.message ?? 'Failed to load DLQ entries';
    toast.error(dlqStore.error!);
  } else {
    dlqStore.error = null;
  }
});

watch(
  [
    () => dlqStore.filterStatus,
    () => dlqStore.filterQueue,
    () => dlqStore.filterSearch,
    () => dlqStore.offset,
    () => dlqStore.limit,
  ],
  () => {
    instantRefetch();
  },
);
</script>

<template>
  <div class="dlq-column">
    <PanelLayout class="dlq-column__panel">
      <DlqListHeader
        :show-loading="showLoading"
        :filter-status="dlqStore.filterStatus"
        :filter-queue="dlqStore.filterQueue"
        :filter-search="dlqStore.filterSearch"
        :hide-read="dlqStore.hideRead"
        :total="dlqStore.total"
        :current-page="dlqStore.currentPage"
        :total-pages="dlqStore.totalPages"
        :limit="dlqStore.limit"
        :offset="dlqStore.offset"
        @reload="handleRefresh"
        @update:filter-status="(value) => (dlqStore.filterStatus = value)"
        @update:filter-queue="(value) => (dlqStore.filterQueue = value)"
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
        :selected-entry-id="dlqStore.selectedEntry?.requestId ?? null"
        :error="dlqStore.error"
        :hide-read="dlqStore.hideRead"
        :is-entry-read="(entry) => dlqStore.isEntryRead(entry)"
        @select="onSelect"
        @retry="onRetry"
        @archive="onArchive"
        @delete="onDelete"
      />
    </PanelLayout>
  </div>

  <div class="dlq-column">
    <DlqDetailsBody
      class="dlq-column__panel"
      :entry="dlqStore.selectedEntry"
      :models="props.models"
      @save-payload="onSavePayload"
      @save-queue="onSaveQueue"
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
    height: calc(100vh - 10rem);
  }

  .dlq-column__panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
}
</style>
