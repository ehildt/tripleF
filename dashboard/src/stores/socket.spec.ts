import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => {
  const mockSocket = {
    connected: true,
    id: 'socket-123',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

vi.mock('./helpers/socket/get-persistent-socket-session-id.helper', () => ({
  getPersistentSocketSessionId: vi.fn(() => 'persistent-conversation-123'),
}));

vi.mock('../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  })),
}));

import { io } from 'socket.io-client';

import { useSocketStore } from './socket';

const MOCK_SESSION_ID = 'persistent-conversation-123';

describe('useSocketStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initializes with disconnected state and persistent conversation id', () => {
    const store = useSocketStore();
    expect(store.connectionState).toBe('disconnected');
    expect(store.socketId).toBe(MOCK_SESSION_ID);
    expect(store.socketError).toBeNull();
  });

  it('initSocket creates socket with persistent conversation id auth', () => {
    vi.stubEnv('VITE_SOCKET_URL', 'http://localhost:3000');
    const store = useSocketStore();
    store.initSocket();
    expect(io).toHaveBeenCalledWith(
      'http://localhost:3000',
      expect.objectContaining({
        auth: { conversationId: MOCK_SESSION_ID },
      }),
    );
  });

  it('listenToEvent applies listener when connected', () => {
    const store = useSocketStore();
    store.initSocket();
    store.listenToEvent('harness');
    expect(store.connectedEvents.has('harness')).toBe(true);
  });

  it('joinRoom adds room to connectedRooms', () => {
    const store = useSocketStore();
    store.initSocket();
    store.joinRoom('room1', 'harness');
    expect(store.connectedRooms.get('harness')?.has('room1')).toBe(true);
  });

  it('leaveRoom removes room from connectedRooms', () => {
    const store = useSocketStore();
    store.initSocket();
    store.joinRoom('room1', 'harness');
    store.leaveRoom('room1', 'harness');
    expect(store.connectedRooms.has('harness')).toBe(false);
  });

  it('closeEvent removes event and rooms', () => {
    const store = useSocketStore();
    store.initSocket();
    store.listenToEvent('harness');
    store.joinRoom('room1', 'harness');
    store.closeEvent('harness');
    expect(store.connectedEvents.has('harness')).toBe(false);
    expect(store.connectedRooms.has('harness')).toBe(false);
  });
});
