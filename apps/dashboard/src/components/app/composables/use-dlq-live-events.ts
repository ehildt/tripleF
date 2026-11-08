import type { Socket } from 'socket.io-client';
import { onMounted, onUnmounted } from 'vue';

import { useDlqCache } from '@/api/queries/use-dlq-cache';
import { useDlqActivity } from '@/components/dlq/composables/use-dlq-activity';
import { useDlqQueryState } from '@/components/dlq/composables/use-dlq-query-state';
import { parseSocketEvent } from '@/composables/helpers/parse-socket-event.helper';
import { useSocket } from '@/composables/use-socket/use-socket';

import { useActiveTab } from './use-active-tab';
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
 * upserts/removals update the current query-cache page immutably, and a
 * bulk change invalidates cached pages, refetching only when DLQ is active. The
 * listeners are attached once the socket exists and detached on unmount.
 */
export function useDlqLiveEvents(): void {
  const socketStore = useSocket();
  const queryCache = useDlqCache();
  const queryState = useDlqQueryState();
  const { markDlqActivity } = useDlqActivity();
  const { activeTab } = useActiveTab();

  let socket: Socket | null = null;

  function handleEntryUpserted(payload: unknown): void {
    const event = parseSocketEvent(payload);
    const entry = (event?.data as DlqEntryUpsertedData | undefined)?.entry;
    if (!event || event.type !== DLQ_ENTRY_UPSERTED_TOPIC || !entry) return;
    markDlqActivity();
    queryCache.applyUpsertedEntry(entry, queryState.getQueryParams());
  }

  function handleEntriesRemoved(payload: unknown): void {
    const event = parseSocketEvent(payload);
    const ids = (event?.data as DlqEntriesRemovedData | undefined)?.ids;
    if (!event || event.type !== DLQ_ENTRIES_REMOVED_TOPIC || !ids) return;
    markDlqActivity();
    queryCache.applyRemovedEntries(ids, queryState.getQueryParams());
  }

  function handleBulkChanged(payload: unknown): void {
    const event = parseSocketEvent(payload);
    if (!event || event.type !== DLQ_BULK_CHANGED_TOPIC) return;
    markDlqActivity();
    queryCache.invalidateDlqQueries(
      activeTab.value === 'dlq' ? 'active' : 'none',
    );
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
