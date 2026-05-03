import type { SocketProvider } from '../src/types/socket-provider.model';

/**
 * Storybook-only mock for the SocketProvider.
 *
 * The real SocketProvider comes from `useSocketStore()` and is wired to a
 * socket.io-client connection. In Storybook there is no live backend, so
 * every method is a no-op or returns a benign default. Pass it via
 * `socketProvider` on stories that render the chat or any component that
 * consumes a socket.
 */
export function createMockSocketProvider(): SocketProvider {
  return {
    getSocket: () => ({ connected: true, on: () => {}, off: () => {} }),
    joinRoom: () => {},
    leaveRoom: () => {},
    listenToEvent: () => {},
    stopListening: () => {},
    trackRequest: (
      _endpoint: string,
      _method: string,
      promise: Promise<Response>,
    ) => promise,
    addMessage: () => {},
    addPendingMessage: () => {},
    updatePendingMessage: () => {},
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
    closeEvent: () => {},
    closeRoom: () => {},
  };
}
