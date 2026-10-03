/**
 * Socket.IO bus envelope contract — see docs/socket-event-bus.md.
 *
 * The root is a closed set: protocol version, kind, topic, unique id,
 * timestamp, correlation meta, and the domain payload. Nothing else may
 * appear at the root, and domain data never lives in `meta`.
 */

export type SocketEventKind = 'event' | 'reply' | 'command';

/** Correlation ids only. Domain data never lives here. */
export interface SocketEventMeta {
  requestId?: string;
  roomId?: string;
  sessionId?: string;
}

export interface SocketEvent<TData = unknown> {
  /** Envelope protocol version — the literal 1. */
  v: 1;
  /** Classifies the frame so generic tooling needs no payload parse. */
  kind: SocketEventKind;
  /** Mirrors the socket.io topic name, e.g. 'dlq:changed'. */
  type: string;
  /** Unique per emission — deduplication and tracing. */
  id: string;
  /** ISO-8601 producer timestamp. */
  at: string;
  /** Correlation ids only: requestId, roomId, sessionId. */
  meta?: SocketEventMeta;
  /** The only place domain payload lives; may be an empty object. */
  data: TData;
}
