<script setup lang="ts">
import { CircleAlert, Database, RefreshCcw, Search } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';

import {
  useDeleteDlqMutation,
  useDlqQuery,
  useReinstateSelectedDlqMutation,
  useRetryDlqMutation,
  useUpdateDlqMutation,
} from '../../api/queries/use-dlq.query';
import EventLogPendingIndicator from '../../components/pending-indicator/EventLog.PendingIndicator.vue';
import InputSelect from '../../components/ui/InputSelect.vue';
import InputText from '../../components/ui/InputText.vue';
import Pagination from '../../components/ui/Pagination.vue';
import { useToast } from '../../composables/use-toast';
import { useDlqStore } from '../../stores/dlq';
import {
  useMcpMessagesStore,
  useRestMessagesStore,
} from '../../stores/messages';
import { useSocketStore } from '../../stores/socket';
import type { VisionDlq } from '../../types/vision-dlq.model';
import DebugPanelHeaderTitle from '../debug/DebugPanel.Header.Title.vue';
import DebugPanelHeader from '../debug/DebugPanel.Header.vue';
import DebugPanelLayout from '../debug/DebugPanel.Layout.vue';
import DlqPanelDetails from './DlqPanel.Details.vue';
import DlqPanelList from './DlqPanel.List.vue';

const props = defineProps<{
  models: string[];
}>();

const dlqStore = useDlqStore();
const toast = useToast();
const socketStore = useSocketStore();

onMounted(() => {
  socketStore.listenToEvent('vision');
});

const statusOptions = [
  'Status',
  'PENDING_RETRY',
  'REINSERTED',
  'ARCHIVED',
  'PENDING_DELETION',
];
const queueOptions = ['Queue', 'describe', 'compare', 'ocr'];

const {
  data: dlqData,
  error,
  isError,
  refetch,
} = useDlqQuery(() => dlqStore.getQueryParams());

const retryMutation = useRetryDlqMutation();
const reinstateSelectedMutation = useReinstateSelectedDlqMutation();
const deleteMutation = useDeleteDlqMutation();
const updateMutation = useUpdateDlqMutation();

const showLoading = ref(false);
let loadingTimer: ReturnType<typeof setTimeout> | null = null;
let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
let loadingStartedAt = 0;
const MIN_LOADING_MS = 3000;

function guardedRefetch() {
  if (loadingTimer) clearTimeout(loadingTimer);
  if (loadingTimeout) clearTimeout(loadingTimeout);
  showLoading.value = true;
  loadingStartedAt = Date.now();
  const failTimer = setTimeout(() => {
    showLoading.value = false;
    toast.error('Request timed out');
  }, 30000);
  loadingTimeout = failTimer;
  refetch();
}

watch(dlqData, (val) => {
  if (val) {
    dlqStore.setEntries(val);
    if (showLoading.value) {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      const elapsed = Date.now() - loadingStartedAt;
      const remaining = MIN_LOADING_MS - elapsed;
      if (remaining > 0) {
        loadingTimer = setTimeout(() => {
          showLoading.value = false;
        }, remaining);
      } else {
        showLoading.value = false;
      }
    }
  }
});

watch(isError, (val) => {
  if (val) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    showLoading.value = false;
    dlqStore.error = error.value?.message ?? 'Failed to load DLQ entries';
    toast.error(dlqStore.error!);
  } else {
    dlqStore.error = null;
  }
});

function onSelect(entry: VisionDlq) {
  dlqStore.selectEntry(
    dlqStore.selectedEntry?.requestId === entry.requestId ? null : entry,
  );
}

async function onRetry(requestId: string) {
  dlqStore.error = null;
  try {
    const res = await retryMutation.mutateAsync(requestId);
    toast.success(`Retried ${res.restored} job(s)`);
    guardedRefetch();
  } catch {
    toast.error('Retry failed');
  }
}

async function onReinstateSelected(source: string) {
  if (dlqStore.selectedRequestIds.size === 0) return;
  dlqStore.error = null;
  try {
    const requestIds = [...dlqStore.selectedRequestIds];
    const res = await reinstateSelectedMutation.mutateAsync(requestIds);
    toast.success(`Reinstated ${res.restored} job(s)`);

    const store =
      source === 'MCP' ? useMcpMessagesStore() : useRestMessagesStore();
    for (const requestId of res.requestIds ?? requestIds) {
      const exists = store.messages.some((m) => m.data.requestId === requestId);
      if (!exists) {
        store.trackRequest(requestId);
        store.addPendingMessage('vision', '', requestId, undefined, true);
      }
    }

    dlqStore.clearSelection();
    guardedRefetch();
  } catch {
    toast.error('Reinstate selected failed');
  }
}

async function onArchive(requestId: string) {
  const entry = dlqStore.entries.find((e) => e.requestId === requestId);
  if (entry && entry.status === 'PENDING_DELETION') {
    return;
  }
  try {
    await updateMutation.mutateAsync({
      requestId,
      data: { status: 'ARCHIVED' },
    });
    toast.success('Archived');
    guardedRefetch();
  } catch {
    toast.error('Archive failed');
  }
}

async function onDelete(requestId: string) {
  try {
    await deleteMutation.mutateAsync(requestId);
    toast.success('Marked for deletion');
    if (dlqStore.selectedEntry?.requestId === requestId) {
      dlqStore.clearSelection();
    }
    guardedRefetch();
  } catch {
    toast.error('Delete failed');
  }
}

async function onSavePayload(
  requestId: string,
  payload: Record<string, unknown>,
) {
  try {
    await updateMutation.mutateAsync({ requestId, data: { payload } });
    toast.success('Payload updated');
    guardedRefetch();
  } catch {
    toast.error('Payload update failed');
  }
}

async function onSaveQueue(requestId: string, queueName: string) {
  try {
    await updateMutation.mutateAsync({ requestId, data: { queueName } });
    toast.success('Queue updated');
    guardedRefetch();
  } catch {
    toast.error('Queue update failed');
  }
}

watch(
  [
    () => dlqStore.filterStatus,
    () => dlqStore.filterQueue,
    () => dlqStore.filterSearch,
  ],
  () => {
    guardedRefetch();
  },
);

watch([() => dlqStore.offset, () => dlqStore.limit], () => {
  guardedRefetch();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->

    <DebugPanelLayout>
      <DebugPanelHeader>
        <DebugPanelHeaderTitle label="Filters" />
        <div class="flex items-center gap-2 ml-auto min-w-0">
          <div class="relative inline-flex items-center h-6.5 w-19">
            <Transition name="fade">
              <button
                v-if="!showLoading"
                key="reload"
                class="absolute inset-0 flex items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold uppercase border border-divider text-fg-muted hover:text-fg-primary hover:border-fg-muted transition-colors"
                @click="guardedRefetch()"
              >
                <RefreshCcw class="w-3 h-3" /> Reload
              </button>
              <div
                v-else
                key="loading"
                class="absolute inset-0 flex items-center justify-center"
              >
                <EventLogPendingIndicator />
              </div>
            </Transition>
          </div>
        </div>
      </DebugPanelHeader>
      <div class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-48 shrink-0">
            <InputSelect
              v-model="dlqStore.filterStatus"
              :options="statusOptions"
              placeholder="Status"
            >
              <template #prepend-icon>
                <CircleAlert class="w-3.5 h-3.5 text-fg-muted" />
              </template>
            </InputSelect>
          </div>

          <div class="w-40 shrink-0">
            <InputSelect
              v-model="dlqStore.filterQueue"
              :options="queueOptions"
              placeholder="Queue"
            >
              <template #prepend-icon>
                <Database class="w-3.5 h-3.5 text-fg-muted" />
              </template>
            </InputSelect>
          </div>

          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Search class="w-3.5 h-3.5 text-fg-muted shrink-0" />
            <InputText
              v-model="dlqStore.filterSearch"
              placeholder="Search payload, ID, queue, reason..."
              class="flex-1"
            />
          </div>
        </div>
        <Pagination
          v-if="dlqStore.total > 0"
          class="mt-4 pt-3 border-t border-divider"
          :current-page="dlqStore.currentPage"
          :total-pages="dlqStore.totalPages"
          :total="dlqStore.total"
          :limit="dlqStore.limit"
          :offset="dlqStore.offset"
          @first="dlqStore.setPage(1)"
          @prev="dlqStore.prevPage"
          @next="dlqStore.nextPage"
          @last="dlqStore.setPage(dlqStore.totalPages)"
          @page="dlqStore.setPage"
          @set-page-size="dlqStore.setPageSize"
        />
      </div>
    </DebugPanelLayout>

    <!-- List + Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <DlqPanelList
        :entries="dlqStore.entries"
        :selected-entry-id="dlqStore.selectedEntry?.requestId ?? null"
        :error="dlqStore.error"
        :selected-count="dlqStore.selectedCount"
        :selected-request-ids="dlqStore.selectedRequestIds"
        @select="onSelect"
        @toggle-selection="dlqStore.toggleSelection"
        @set-all-selected="dlqStore.setAllSelected"
        @retry="onRetry"
        @archive="onArchive"
        @delete="onDelete"
        @reinstate-selected="onReinstateSelected"
      />
      <DlqPanelDetails
        :entry="dlqStore.selectedEntry"
        :models="props.models"
        @save-payload="onSavePayload"
        @save-queue="onSaveQueue"
      />
    </div>
  </div>
</template>
