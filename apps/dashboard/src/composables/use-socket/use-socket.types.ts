import type { Socket } from 'socket.io-client';
import type { Ref } from 'vue';

import type { ConnectionState } from '@/types/connection-state.model';
import type { SocketDebugEntry } from '@/types/socket-debug-entry.model';

/** Public surface of the singleton Socket.IO client workflow. */
export interface SocketFacade {
  /** Current Socket.IO connection, or null before initialization. */
  socket: Ref<Socket | null>;
  /** Current transport connection state. */
  connectionState: Ref<ConnectionState>;
  /** Latest connection error message, if any. */
  socketError: Ref<string | null>;
  /** Last observed connection lifecycle event. */
  lastConnectionEvent: Ref<string>;
  /** Persistent application session id used for socket authentication. */
  socketId: Ref<string | null>;
  /** Event channels with registered listeners. */
  connectedEvents: Ref<Set<string>>;
  /** Joined room ids grouped by event channel. */
  connectedRooms: Ref<Map<string, Set<string>>>;
  /** Flattened event/room subscription identities. */
  connectedPairs: Ref<string[]>;
  /** Register the debug-entry and harness-message callbacks. */
  setCallbacks: (
    onDebug: ((entry: SocketDebugEntry) => void) | null,
    onMessage: ((event: string, data: unknown) => void) | null,
  ) => void;
  /** Create the shared socket without forcing a duplicate connection. */
  initSocket: () => Socket | null;
  /** Return the connected socket or initiate its connection. */
  ensureSocketConnection: () => Socket | null;
  /** Join a room associated with an event channel. */
  joinRoom: (roomId: string, eventName: string) => void;
  /** Leave a room associated with an event channel. */
  leaveRoom: (roomId: string, eventName: string) => void;
  /** Listen to an event channel, deferring until connected when necessary. */
  listenToEvent: (eventName: string) => void;
  /** Stop listening to the first currently connected event channel. */
  stopListening: () => void;
  /** Remove an event listener and leave all of its joined rooms. */
  closeEvent: (eventName: string) => void;
  /** Leave one room and update its subscription registry. */
  closeRoom: (eventName: string, roomId: string) => void;
}
