import { createSocketProvider } from '@/components/chat/composables/helpers/create-socket-provider.helper';
import { useDebugRequestTracker } from '@/components/debug/composables/use-debug-request-tracker';
import { useSocket } from '@/composables/use-socket/use-socket';
import { useDebugStore } from '@/stores/debug/debug.store';
import { useMessagesStore } from '@/stores/messages/messages.store';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * The socket provider facade, assembled from its three Pinia stores and
 * exposed by import rather than provide/inject. Every caller resolves the
 * same store-backed service directly — no app-root provider and no component
 * relaying it as an argument.
 */
export function useSocketProvider(): SocketProvider {
  const socket = useSocket();
  const debugStore = useDebugStore();
  const requestTracker = useDebugRequestTracker();
  return createSocketProvider(
    {
      ...socket,
      connectedEvents: socket.connectedEvents.value,
      connectedRooms: socket.connectedRooms.value,
    },
    {
      trackRequest: requestTracker.trackRequest,
      addSocketDebugEntry: debugStore.addDebugResult,
    },
    useMessagesStore(),
  );
}
