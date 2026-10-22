import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  // A fresh socket per init call — tests mutate `connected`, so a shared
  // instance would leak state between tests.
  io: vi.fn(() => ({
    connected: true,
    id: 'socket-123',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock(
  '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper',
  () => ({
    getPersistentSocketSessionId: vi.fn(() => 'persistent-conversation-123'),
  }),
);

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: vi.fn(() => ({
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  })),
}));

import { io } from 'socket.io-client';

import { useSocket } from './use-socket';

const MOCK_SESSION_ID = 'persistent-conversation-123';

/** Args of the first io() call — the singleton socket is created exactly
 * once for the whole module, so capture the construction args at boot and
 * keep the per-test assertion independent of mock history/order. */
let firstIoCallArgs: readonly unknown[] | undefined;

describe('useSocket', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_SOCKET_URL', 'http://localhost:3000');
    useSocket().initSocket();
    firstIoCallArgs = (io as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0];
  });

  beforeEach(() => {
    // Module-scope singleton: subscription state and the socket handle
    // persist across tests in this file; specs assert narrowly and tolerate
    // leftovers from earlier tests in the same file.
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    const instance = useSocket().socket.value;
    if (instance) instance.connected = true;
  });

  it('initializes with disconnected state and persistent conversation id', () => {
    const socket = useSocket();
    expect(socket.connectionState.value).toBe('disconnected');
    expect(socket.socketId.value).toBe(MOCK_SESSION_ID);
    expect(socket.socketError.value).toBeNull();
  });

  it('initSocket creates socket with persistent conversation id auth', () => {
    expect(firstIoCallArgs?.[0]).toBe('http://localhost:3000');
    expect(firstIoCallArgs?.[1]).toEqual(
      expect.objectContaining({
        auth: { conversationId: MOCK_SESSION_ID },
      }),
    );
  });

  it('listenToEvent applies listener when connected', () => {
    const socket = useSocket();
    socket.initSocket();
    socket.listenToEvent('harness');
    expect(socket.connectedEvents.value.has('harness')).toBe(true);
  });

  it('joinRoom adds room to connectedRooms', () => {
    const socket = useSocket();
    socket.initSocket();
    socket.joinRoom('room1', 'harness');
    expect(socket.connectedRooms.value.get('harness')?.has('room1')).toBe(true);
  });

  it('leaveRoom removes room from connectedRooms', () => {
    const socket = useSocket();
    socket.initSocket();
    socket.joinRoom('room1', 'harness');
    socket.leaveRoom('room1', 'harness');
    expect(socket.connectedRooms.value.has('harness')).toBe(false);
  });

  it('listenToEvent queues pending while disconnected', () => {
    const socket = useSocket();
    socket.initSocket();
    // The mocked socket reports connected: true; force the disconnected
    // branch instead.
    socket.socket.value!.connected = false;
    socket.listenToEvent('dlq');
    expect(socket.connectedEvents.value.has('dlq')).toBe(false);
  });

  it('stopListening removes one subscribed event', () => {
    const socket = useSocket();
    socket.initSocket();
    socket.listenToEvent('harness');
    socket.listenToEvent('dlq');
    expect(socket.connectedEvents.value.size).toBe(2);

    socket.stopListening();
    expect(socket.connectedEvents.value.size).toBe(1);
    socket.stopListening();
    expect(socket.connectedEvents.value.size).toBe(0);
  });

  it('closeEvent removes event and rooms', () => {
    const socket = useSocket();
    socket.initSocket();
    socket.listenToEvent('harness');
    socket.joinRoom('room1', 'harness');
    socket.closeEvent('harness');
    expect(socket.connectedEvents.value.has('harness')).toBe(false);
    expect(socket.connectedRooms.value.has('harness')).toBe(false);
  });
});
