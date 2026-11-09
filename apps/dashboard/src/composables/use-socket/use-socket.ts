import { io, type Socket } from 'socket.io-client';
import { ref, shallowRef } from 'vue';

import { buildConnectedPairs } from '@/composables/helpers/build-connected-pairs.helper';
import { createEventListener } from '@/composables/helpers/create-event-listener.helper';
import { makeDebugEntry } from '@/composables/helpers/make-debug-entry.helper';
import type { ConnectionState } from '@/types/connection-state.model';
import type { SocketDebugEntry } from '@/types/socket-debug-entry.model';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import type { SocketFacade } from './use-socket.types';

const SOCKET_SESSION_ID = getPersistentSocketSessionId();

/**
 * The socket.io client facade: one connection, its subscription sets, and
 * the debug/harness callback wiring. Module-scope singleton (rule 20): the
 * app speaks over exactly one socket no matter which caller asks, so the
 * socket handle and subscription state live at module scope; specs drive
 * fresh `io` instances via the mocked socket.io module per test file.
 *
 * This used to be a Pinia store; it controls the socket client lifecycle
 * (connect, listen, join/leave) — behavior, not data — so per convention it
 * is a composable. Consumers bind it directly; App separately registers the
 * harness event handler and request-debug consumers import their owner.
 */
const socket = shallowRef<Socket | null>(null);
const connectionState = ref<ConnectionState>('disconnected');
const socketError = ref<string | null>(null);
const lastConnectionEvent = ref<string>('disconnected');
const socketId = ref<string | null>(SOCKET_SESSION_ID);

const connectedEvents = ref<Set<string>>(new Set());
const connectedRooms = ref<Map<string, Set<string>>>(new Map());
const connectedPairs = ref<string[]>([]);

const eventListeners = new Map<string, (...args: unknown[]) => void>();

const pendingEvents: Set<string> = new Set();

interface PendingRoomSubscription {
  roomId: string;
  eventName: string;
}

const pendingRooms: PendingRoomSubscription[] = [];
let addSocketDebugEntryCallback: ((entry: SocketDebugEntry) => void) | null =
  null;
let addMessageCallback: ((event: string, data: unknown) => void) | null = null;

// Track which request IDs have been logged to avoid duplicates for streaming
const loggedRequestIds = ref<Set<string>>(new Set());

function bumpSubscription() {
  connectedEvents.value = new Set(connectedEvents.value);
  const cloned = new Map<string, Set<string>>();
  for (const [k, v] of connectedRooms.value) {
    cloned.set(k, new Set(v));
  }
  connectedRooms.value = cloned;
  connectedPairs.value = buildConnectedPairs(
    connectedEvents.value,
    connectedRooms.value,
  );
}

function setCallbacks(
  onDebug: ((entry: SocketDebugEntry) => void) | null,
  onMessage: ((event: string, data: unknown) => void) | null,
) {
  addSocketDebugEntryCallback = onDebug;
  addMessageCallback = onMessage;
}

function initSocket(): Socket | null {
  if (socket.value?.connected) return socket.value;
  if (socket.value) {
    socket.value.connect();
    return socket.value;
  }

  socket.value = io(import.meta.env.VITE_SOCKET_URL || undefined, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: { conversationId: SOCKET_SESSION_ID },
  });

  socket.value.on('connect', () => {
    connectionState.value = 'connected';
    socketError.value = null;
    socketId.value = SOCKET_SESSION_ID;

    if (lastConnectionEvent.value !== 'connected') {
      lastConnectionEvent.value = 'connected';
    }
    for (const ev of pendingEvents) {
      applyEventListener(ev);
    }
    pendingEvents.clear();
    for (const pr of pendingRooms) {
      joinRoom(pr.roomId, pr.eventName);
    }
    pendingRooms.length = 0;
  });

  socket.value.on('disconnect', () => {
    connectionState.value = 'disconnected';
    if (lastConnectionEvent.value !== 'disconnected') {
      lastConnectionEvent.value = 'disconnected';
    }
  });

  socket.value.on('connect_error', (err: Error) => {
    connectionState.value = 'error';
    socketError.value = err.message;
    if (lastConnectionEvent.value !== 'error') {
      lastConnectionEvent.value = 'error';
    }
  });

  return socket.value;
}

function ensureSocketConnection(): Socket | null {
  if (socket.value) {
    if (socket.value.connected) {
      return socket.value;
    }
    socket.value.connect();
    return socket.value;
  }

  return initSocket();
}

function listenToEvent(eventName: string) {
  if (!socket.value?.connected) {
    if (!socket.value) {
      ensureSocketConnection();
    }
    pendingEvents.add(eventName);
    return;
  }

  applyEventListener(eventName);
}

function applyEventListener(eventName: string) {
  if (eventListeners.has(eventName)) {
    connectedEvents.value.add(eventName);
    bumpSubscription();
    return;
  }

  const listener = createEventListener(eventName, {
    socketId,
    loggedRequestIds,
    onMessage: (event, payload) => addMessageCallback?.(event, payload),
    onDebugEntry: (entry) => addSocketDebugEntryCallback?.(entry),
  });

  eventListeners.set(eventName, listener);
  socket.value!.on(eventName, listener);
  connectedEvents.value.add(eventName);
  bumpSubscription();

  addSocketDebugEntryCallback?.(
    makeDebugEntry({
      endpoint: `socket.io:${eventName}`,
      method: 'LISTEN',
      status: 'success',
      direction: 'request',
      conversationId: socketId.value || undefined,
    }),
  );
}

function stopListening() {
  if (!socket.value?.connected || connectedEvents.value.size === 0) return;

  const eventName = Array.from(connectedEvents.value)[0];
  const listener = eventListeners.get(eventName);
  if (listener) {
    socket.value!.off(eventName, listener);
    eventListeners.delete(eventName);
  }
  connectedEvents.value.delete(eventName);
  bumpSubscription();
}

function closeEvent(eventName: string) {
  if (connectedEvents.value.has(eventName)) {
    const listener = eventListeners.get(eventName);
    if (listener) {
      socket.value!.off(eventName, listener);
      eventListeners.delete(eventName);
    }

    const rooms = connectedRooms.value.get(eventName);
    if (rooms) {
      rooms.forEach((roomId) => {
        socket.value!.emit('leave', roomId);
      });
      connectedRooms.value.delete(eventName);
    }

    connectedEvents.value.delete(eventName);
    bumpSubscription();

    addSocketDebugEntryCallback?.(
      makeDebugEntry({
        endpoint: `socket.io:${eventName}`,
        method: 'UNLISTEN',
        status: 'success',
        direction: 'request',
        conversationId: socketId.value || undefined,
      }),
    );
  }
}

function closeRoom(eventName: string, roomId: string) {
  const rooms = connectedRooms.value.get(eventName);
  if (rooms && rooms.has(roomId)) {
    socket.value!.emit('leave', roomId);
    rooms.delete(roomId);

    if (rooms.size === 0) {
      connectedRooms.value.delete(eventName);
    }
    bumpSubscription();
    addSocketDebugEntryCallback?.(
      makeDebugEntry({
        endpoint: `socket.io:${eventName}:room:${roomId}`,
        method: 'LEAVE',
        status: 'success',
        direction: 'request',
        event: eventName,
        roomId: roomId,
        conversationId: socketId.value || undefined,
      }),
    );
  }
}

function joinRoom(roomId: string, eventName: string) {
  if (connectedRooms.value.get(eventName)?.has(roomId)) return;
  if (socket.value?.connected) {
    socket.value.emit('join', roomId);

    if (!connectedRooms.value.has(eventName)) {
      connectedRooms.value.set(eventName, new Set());
    }
    connectedRooms.value.get(eventName)!.add(roomId);
    bumpSubscription();
    addSocketDebugEntryCallback?.(
      makeDebugEntry({
        endpoint: `socket.io:${eventName}:room:${roomId}`,
        method: 'JOIN',
        status: 'success',
        direction: 'request',
        event: eventName,
        roomId: roomId,
        conversationId: socketId.value || undefined,
      }),
    );
  } else {
    pendingRooms.push({ roomId, eventName });
  }
}

function leaveRoom(roomId: string, eventName: string) {
  if (socket.value?.connected) {
    socket.value.emit('leave', roomId);

    const rooms = connectedRooms.value.get(eventName);
    if (rooms) {
      rooms.delete(roomId);
      if (rooms.size === 0) {
        connectedRooms.value.delete(eventName);
      }
      bumpSubscription();
    }

    addSocketDebugEntryCallback?.(
      makeDebugEntry({
        endpoint: `socket.io:${eventName}:room:${roomId}`,
        method: 'LEAVE',
        status: 'success',
        direction: 'request',
        event: eventName,
        roomId: roomId,
        conversationId: socketId.value || undefined,
      }),
    );
  }
}

/** The single shared facade instance. Every caller — and every spec spying
 * on it — must see the same object, exactly like the Pinia store did. */
const api: SocketFacade = {
  socket,
  connectionState,
  socketError,
  lastConnectionEvent,
  socketId,
  connectedEvents,
  connectedRooms,
  connectedPairs,
  setCallbacks,
  initSocket,
  ensureSocketConnection,
  joinRoom,
  leaveRoom,
  listenToEvent,
  stopListening,
  closeEvent,
  closeRoom,
};

export function useSocket(): SocketFacade {
  return api;
}
