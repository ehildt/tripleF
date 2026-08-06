import { vi } from 'vitest';
import { computed } from 'vue';

import type { AppViewContext } from '@/composables/use-app-view-context';
import type { DebugResult } from '@/types/debug.model';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * Test double for the app-view-context that `App.vue` provides to its route
 * views (Chat, Dlq, DebugSection, …). These components call
 * `useAppViewContext()` directly, so specs that mount them must provide a
 * full context or setup() aborts on destructuring `undefined`.
 *
 * Store-derived fields are `ComputedRef`s in the real context, so this
 * factory wraps the given plain values in `computed` to match.
 */
export function makeMockSocketProvider(): SocketProvider {
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

interface MockAppViewContextInput {
  socketProvider?: SocketProvider;
  viewModels?: string[];
  debugResults?: DebugResult[];
  selectedDebugResult?: DebugResult | null;
  clearDebugResults?: () => void;
  selectDebugResult?: (result: DebugResult | null) => void;
  selectDebugMarkRead?: (id: string) => void;
}

export function mockAppViewContext(
  overrides: MockAppViewContextInput = {},
): AppViewContext {
  return {
    socketProvider: overrides.socketProvider ?? makeMockSocketProvider(),
    viewModels: computed(() => overrides.viewModels ?? []),
    debugResults: computed(() => overrides.debugResults ?? []),
    selectedDebugResult: computed(() => overrides.selectedDebugResult ?? null),
    clearDebugResults: overrides.clearDebugResults ?? vi.fn(),
    selectDebugResult: overrides.selectDebugResult ?? vi.fn(),
    selectDebugMarkRead: overrides.selectDebugMarkRead ?? vi.fn(),
  };
}
