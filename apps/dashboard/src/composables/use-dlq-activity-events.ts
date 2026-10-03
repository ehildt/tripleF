import type { Socket } from 'socket.io-client';
import { onMounted, onUnmounted } from 'vue';

import { parseSocketEvent } from '@/composables/helpers/parse-socket-event.helper';
import { useDlqStore } from '@/stores/dlq';
import { useSocketStore } from '@/stores/socket';

const DLQ_CHANGED_TOPIC = 'dlq:changed';

/**
 * Listen for the server's "the DLQ changed" signal and flag the dlq store so
 * the tab menu can show an attention dot. No data is fetched here — the DLQ
 * list still loads on open; this only lights the dot. The listener is
 * attached once the socket exists and detached on unmount.
 */
export function useDlqActivityEvents(): void {
  const socketStore = useSocketStore();
  const dlqStore = useDlqStore();

  let socket: Socket | null = null;

  function handleDlqChanged(payload: unknown): void {
    const event = parseSocketEvent(payload);
    if (event && event.type === DLQ_CHANGED_TOPIC) {
      dlqStore.markDlqActivity();
    }
  }

  onMounted(() => {
    socket = socketStore.ensureSocketConnection();
    socket?.on(DLQ_CHANGED_TOPIC, handleDlqChanged);
  });

  onUnmounted(() => {
    socket?.off(DLQ_CHANGED_TOPIC, handleDlqChanged);
  });
}
