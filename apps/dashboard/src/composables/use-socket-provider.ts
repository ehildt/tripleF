import { useDebugStore } from '@/stores/debug';
import { createSocketProvider } from '@/stores/helpers/socket/create-socket-provider.helper';
import { useApiMessagesStore } from '@/stores/messages';
import { useSocketStore } from '@/stores/socket';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * The socket provider facade, assembled from its three Pinia stores and
 * exposed by import rather than provide/inject. Every caller resolves the
 * same store-backed service directly — no app-root provider and no component
 * relaying it as an argument.
 */
export function useSocketProvider(): SocketProvider {
  return createSocketProvider(
    useSocketStore(),
    useDebugStore(),
    useApiMessagesStore(),
  );
}
