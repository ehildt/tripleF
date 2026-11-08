import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const socketMock = {
  ensureSocketConnection: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  listenToEvent: vi.fn(),
  stopListening: vi.fn(),
  connectedEvents: ref(new Set(['harness'])),
  connectedRooms: ref(new Map([['harness', new Set(['room-1'])]])),
  closeEvent: vi.fn(),
  closeRoom: vi.fn(),
};
const debugStoreMock = { addDebugResult: vi.fn() };
const requestTrackerMock = { trackRequest: vi.fn() };
const messagesStoreMock = {
  addMessage: vi.fn(),
  addPendingMessage: vi.fn(),
  updatePendingMessage: vi.fn(),
};

vi.mock('@/composables/use-socket/use-socket', () => ({
  useSocket: () => socketMock,
}));
vi.mock('@/stores/debug/debug.store', () => ({
  useDebugStore: () => debugStoreMock,
}));
vi.mock('@/components/debug/composables/use-debug-request-tracker', () => ({
  useDebugRequestTracker: () => requestTrackerMock,
}));
vi.mock('@/stores/messages/messages.store', () => ({
  useMessagesStore: () => messagesStoreMock,
}));

import { useSocketProvider } from './use-socket-provider';

describe('useSocketProvider', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('delegates socket lifecycle and teardown to the socket facade', () => {
    const provider = useSocketProvider();
    provider.getSocket?.();
    expect(socketMock.ensureSocketConnection).toHaveBeenCalledOnce();
    expect(provider.joinRoom).toBe(socketMock.joinRoom);
    expect(provider.closeEvent).toBe(socketMock.closeEvent);
    expect(provider.closeRoom).toBe(socketMock.closeRoom);
  });

  it('unwraps the reactive connected sets once at assembly time', () => {
    const provider = useSocketProvider();
    expect(provider.connectedEvents).toBeInstanceOf(Set);
    expect(provider.connectedEvents.has('harness')).toBe(true);
    expect(provider.connectedRooms.get('harness')?.has('room-1')).toBe(true);
  });

  it('routes message and debug traffic to the owning stores', () => {
    const provider = useSocketProvider();
    expect(provider.addMessage).toBe(messagesStoreMock.addMessage);
    expect(provider.addPendingMessage).toBe(
      messagesStoreMock.addPendingMessage,
    );
    expect(provider.trackRequest).toBe(requestTrackerMock.trackRequest);
    expect(provider.addSocketDebugEntry).toBe(debugStoreMock.addDebugResult);
  });
});
