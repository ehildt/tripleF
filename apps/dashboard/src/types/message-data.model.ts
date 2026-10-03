/**
 * Socket message-list bookkeeping shape (pending → done tracking, unread
 * badge, DLQ retry dedup). Server traffic arrives as v1 `SocketEvent`
 * envelopes (types in `harness-socket-event.model.ts`) and is routed by the
 * messages store's typed dispatcher — the old flat grab-bag of ~30 optional
 * phase keys was retired with the envelope migration; the entries here keep
 * only what the client-side bookkeeping touches. See docs/socket-event-bus.md.
 */
export interface MessageData {
  pending?: boolean;
  done?: boolean;
  requestId?: string;
  event?: string;
  roomId?: string;
  stream?: boolean;
  conversationId?: string;
}
