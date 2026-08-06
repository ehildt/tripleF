import { vi } from 'vitest';

import type { AppViewContext } from '@/composables/use-app-view-context';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * Test double for the app-view-context that `App.vue` provides to its route
 * views (Chat, Dlq, DebugSection, …). These components call
 * `useAppViewContext()` directly, so specs that mount them must provide a
 * full context or setup() aborts on destructuring `undefined`.
 */
function makeMockSocketProvider(): SocketProvider {
  return {
    getSocket: () => ({ connected: true, on: () => {}, off: () => {} }),
    joinRoom: () => {},
    listenToEvent: () => {},
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

export function mockAppViewContext(
  overrides: Partial<AppViewContext> = {},
): AppViewContext {
  return {
    socketProvider: makeMockSocketProvider(),
    viewModels: [],
    debugResults: [],
    selectedDebugResult: null,
    clearDebugResults: vi.fn(),
    selectDebugResult: vi.fn(),
    selectDebugMarkRead: vi.fn(),
    ...overrides,
  };
}
