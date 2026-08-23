import type { SocketProvider } from '@/types/socket-provider.model';

import type { MessageData } from '../../../types/message-data.model';

export function createSocketProvider(
  socketStore: {
    ensureSocketConnection: () => any;
    joinRoom?: (roomId: string, eventName: string) => void;
    leaveRoom?: (roomId: string, eventName: string) => void;
    listenToEvent?: (eventName: string) => void;
    stopListening?: () => void;
    connectedEvents: Set<string>;
    connectedRooms: Map<string, Set<string>>;
    closeEvent: (eventName: string) => void;
    closeRoom: (eventName: string, roomId: string) => void;
  },
  debugStore: {
    trackRequest: SocketProvider['trackRequest'];
    addSocketDebugEntry: SocketProvider['addSocketDebugEntry'];
  },
  messageStore: {
    addMessage: (event: string, data: MessageData) => void;
    addPendingMessage: (
      event: string,
      roomId: string,
      requestId: string,
      stream?: boolean,
    ) => void;
    updatePendingMessage: (requestId: string, data: MessageData) => void;
  },
): SocketProvider {
  return {
    getSocket: socketStore.ensureSocketConnection,
    joinRoom: socketStore.joinRoom,
    leaveRoom: socketStore.leaveRoom,
    listenToEvent: socketStore.listenToEvent,
    stopListening: socketStore.stopListening,
    trackRequest: debugStore.trackRequest,
    addMessage: messageStore.addMessage,
    addPendingMessage: messageStore.addPendingMessage,
    updatePendingMessage: messageStore.updatePendingMessage,
    connectedEvents: socketStore.connectedEvents,
    connectedRooms: socketStore.connectedRooms,
    closeEvent: socketStore.closeEvent,
    closeRoom: socketStore.closeRoom,
    addSocketDebugEntry: debugStore.addSocketDebugEntry,
  };
}
