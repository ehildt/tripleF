import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { ref } from 'vue';

import type { SocketDebugEntry } from '../types/socket-debug-entry.model';
import { getPersistentSocketSessionId } from './helpers/get-persistent-socket-session-id.helper';
import { makeDebugEntry } from './helpers/make-debug-entry.helper';

const SOCKET_SESSION_ID = getPersistentSocketSessionId();

export type ConnectionState = 'connected' | 'disconnected' | 'error';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<any>(null);
  const connectionState = ref<ConnectionState>('disconnected');
  const socketError = ref<string | null>(null);
  const lastConnectionEvent = ref<string>('disconnected');
  const socketId = ref<string | null>(SOCKET_SESSION_ID);

  const connectedEvents = ref<Set<string>>(new Set());
  const connectedRooms = ref<Map<string, Set<string>>>(new Map());
  const connectedPairs = ref<string[]>([]);

  function buildConnectedPairs() {
    const result: string[] = [];
    const sortedEvents = Array.from(connectedEvents.value).sort();
    for (const event of sortedEvents) {
      const rooms = connectedRooms.value.get(event);
      if (rooms && rooms.size > 0) {
        for (const room of Array.from(rooms).sort()) {
          result.push(`${event}::${room}`);
        }
      } else {
        result.push(event);
      }
    }
    connectedPairs.value = result;
  }

  function bumpSubscription() {
    connectedEvents.value = new Set(connectedEvents.value);
    const cloned = new Map<string, Set<string>>();
    for (const [k, v] of connectedRooms.value) {
      cloned.set(k, new Set(v));
    }
    connectedRooms.value = cloned;
    buildConnectedPairs();
  }

  const eventListeners = new Map<string, (...args: unknown[]) => void>();

  const pendingEvents: Set<string> = new Set();
  const pendingRooms: Array<{ roomId: string; eventName: string }> = [];
  let addSocketDebugEntryCallback: ((entry: SocketDebugEntry) => void) | null =
    null;
  let addMessageCallback: ((event: string, data: unknown) => void) | null =
    null;

  // Track which request IDs have been logged to avoid duplicates for streaming
  const loggedRequestIds = ref<Set<string>>(new Set());

  function setCallbacks(
    onDebug: ((entry: SocketDebugEntry) => void) | null,
    onMessage: ((event: string, data: unknown) => void) | null,
  ) {
    addSocketDebugEntryCallback = onDebug;
    addMessageCallback = onMessage;
  }

  function initSocket() {
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

  function ensureSocketConnection() {
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

    const listener = (data: unknown) => {
      // Inject conversationId into the data before passing to message callback
      const dataWithSession = data as Record<string, unknown>;
      if (typeof dataWithSession === 'object' && dataWithSession !== null) {
        dataWithSession.conversationId = socketId.value;
      }

      // Route to message store - it will filter based on tracked request IDs
      addMessageCallback?.(eventName, dataWithSession);

      // Normalize Ollama snake_case fields
      const raw = dataWithSession as Record<string, unknown>;
      const promptEvalCount = (raw.promptEvalCount ?? raw.prompt_eval_count) as
        number | undefined;
      const evalCount = (raw.evalCount ?? raw.eval_count) as number | undefined;
      const evalDuration = (raw.evalDuration ?? raw.eval_duration) as
        number | undefined;
      const totalDuration = (raw.totalDuration ?? raw.total_duration) as
        number | undefined;

      // Log socket data received in debug log
      const d = raw as unknown as {
        requestId?: string;
        roomId?: string;
        meta?: Array<{ requestId?: string }>;
        stream?: boolean;
        done?: boolean;
      };
      const requestId = d?.requestId || d?.meta?.[0]?.requestId;

      if (requestId) {
        // First DATA event per requestId
        if (!loggedRequestIds.value.has(requestId)) {
          loggedRequestIds.value.add(requestId);
          addSocketDebugEntryCallback?.(
            makeDebugEntry({
              endpoint: `socket.io:${eventName}`,
              method: 'DATA',
              status: 'success',
              direction: 'response',
              requestId: requestId,
              roomId: d?.roomId,
              event: eventName,
              stream: d?.stream,
              conversationId: socketId.value || undefined,
            }),
          );
        }
        // Final event with token data
        if (d?.done && (promptEvalCount != null || evalCount != null)) {
          addSocketDebugEntryCallback?.(
            makeDebugEntry({
              endpoint: `socket.io:${eventName}`,
              method: 'DONE',
              status: 'success',
              direction: 'response',
              requestId: requestId,
              roomId: d?.roomId,
              event: eventName,
              conversationId: socketId.value || undefined,
              promptEvalCount,
              evalCount,
              evalDuration,
              totalDuration,
            }),
          );
        }
      }
    };

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

  return {
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
});
