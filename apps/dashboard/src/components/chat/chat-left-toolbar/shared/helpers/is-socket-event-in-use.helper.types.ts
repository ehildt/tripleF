export interface SocketEventConsumer {
  id: string;
  event?: string;
  subscriptions?: { event: string }[];
}
