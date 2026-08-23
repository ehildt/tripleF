export interface DlqRetrySessionSocket {
  ensureSocketConnection: () => void;
  joinRoom: (roomId: string, eventName: string) => void;
  listenToEvent: (eventName: string) => void;
  connectedEvents: Set<string>;
  connectedRooms: Map<string, Set<string>>;
}
