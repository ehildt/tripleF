export interface SocketListeningConversation {
  id: string;
  event?: string;
  roomId?: string;
  subscriptions?: { event: string; roomId?: string }[];
}
