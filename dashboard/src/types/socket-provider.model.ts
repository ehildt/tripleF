import type { MessageData } from './message-data.model';
import type { TrackRequestDetails } from './track-request-details.model';

export interface SocketProvider {
  getSocket: (event?: string, room?: string) => any;
  joinRoom?: (roomId: string, eventName: string) => void;
  leaveRoom?: (roomId: string, eventName: string) => void;
  listenToEvent?: (eventName: string) => void;
  stopListening?: () => void;
  trackRequest: (
    endpoint: string,
    method: string,
    promise: Promise<Response>,
    details?: TrackRequestDetails,
  ) => Promise<Response>;
  addMessage: (event: string, data: MessageData) => void;
  addPendingMessage: (
    event: string,
    roomId: string,
    requestId: string,
    stream?: boolean,
  ) => void;
  updatePendingMessage: (requestId: string, data: MessageData) => void;
  connectedEvents: Set<string>;
  connectedRooms: Map<string, Set<string>>;
  closeEvent: (eventName: string) => void;
  closeRoom: (eventName: string, roomId: string) => void;
  addSocketDebugEntry?: (result: {
    endpoint: string;
    method: string;
    status: 'success' | 'error';
    statusCode?: number;
    errorMessage?: string;
    responseTime: number;
    type: 'http' | 'socket';
    direction: 'request' | 'response';
  }) => void;
}
