import type { Socket } from 'socket.io-client';
import { onMounted, onUnmounted } from 'vue';

import { parseSocketEvent } from '@/composables/helpers/parse-socket-event.helper';
import { useAppStore } from '@/stores/app';
import { useDlqStore } from '@/stores/dlq';
import { useSocketStore } from '@/stores/socket';

import type {
  DlqEntriesRemovedData,
  DlqEntryUpsertedData,
} from './use-dlq-live-events.types';

const DLQ_ENTRY_UPSERTED_TOPIC = 'dlq:entry-upserted';
const DLQ_ENTRIES_REMOVED_TOPIC = 'dlq:entries-removed';
const DLQ_BULK_CHANGED_TOPIC = 'dlq:bulk-changed';

/**
 * Live DLQ synchronization: the server broadcasts every DLQ mutation on three
 * topics, so the list never polls. Every event lights the tab's activity dot;
 * upserts/removals are applied to the store's current page in place, and a
 * bulk change while the tab is open asks the view for one refetch. The
 * listeners are attached once the socket exists and detached on unmount.
 */
export function useDlqLiveEvents(): void {
  const socketStore = useSocketStore();
  const dlqStore = useDlqStore();
  const appStore = useAppStore();

  let socket: Socket | null = null;

  function handleEntryUpserted(payload: unknown): void {
    const event = parseSocketEvent(payload);
    const entry = (event?.data as DlqEntryUpsertedData | undefined)?.entry;
    if (!event || event.type !== DLQ_ENTRY_UPSERTED_TOPIC || !entry) return;
    dlqStore.markDlqActivity();
    dlqStore.applyUpsertedEntry(entry);
  }

  function handleEntriesRemoved(payload: unknown): void {
    const event = parseSocketEvent(payload);
    const ids = (event?.data as DlqEntriesRemovedData | undefined)?.ids;
    if (!event || event.type !== DLQ_ENTRIES_REMOVED_TOPIC || !ids) return;
    dlqStore.markDlqActivity();
    dlqStore.applyRemovedEntries(ids);
  }

  function handleBulkChanged(payload: unknown): void {
    const event = parseSocketEvent(payload);
    if (!event || event.type !== DLQ_BULK_CHANGED_TOPIC) return;
    dlqStore.markDlqActivity();
    if (appStore.activeTab === 'dlq') {
      dlqStore.requestEntriesRefresh();
    }
  }

  onMounted(() => {
    socket = socketStore.ensureSocketConnection();
    socket?.on(DLQ_ENTRY_UPSERTED_TOPIC, handleEntryUpserted);
    socket?.on(DLQ_ENTRIES_REMOVED_TOPIC, handleEntriesRemoved);
    socket?.on(DLQ_BULK_CHANGED_TOPIC, handleBulkChanged);
  });

  onUnmounted(() => {
    socket?.off(DLQ_ENTRY_UPSERTED_TOPIC, handleEntryUpserted);
    socket?.off(DLQ_ENTRIES_REMOVED_TOPIC, handleEntriesRemoved);
    socket?.off(DLQ_BULK_CHANGED_TOPIC, handleBulkChanged);
  });
}
