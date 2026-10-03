import { randomUUID } from 'node:crypto';

import type {
  SocketEvent,
  SocketEventKind,
  SocketEventMeta,
} from '../types/socket-event.types.js';

interface BuildSocketEventOptions {
  /** Frame classification; defaults to 'event'. */
  kind?: SocketEventKind;
  /** Correlation ids (requestId, roomId, sessionId). */
  meta?: SocketEventMeta;
  /** Override the generated id — deterministic tests and event replay. */
  id?: string;
  /** Override the generated timestamp — deterministic tests. */
  at?: string;
}

/**
 * Build a bus envelope (docs/socket-event-bus.md). This is a factory, not a
 * pure predicate: minting the unique `id` and the `at` timestamp are its only
 * intrinsic side effects, and both are overridable through `options` so tests
 * can construct deterministic envelopes. Every server→client emission must go
 * through here so the envelope shape can never drift between producers.
 */
export function buildSocketEvent<TData = unknown>(
  type: string,
  data: TData,
  options: BuildSocketEventOptions = {},
): SocketEvent<TData> {
  return {
    v: 1,
    kind: options.kind ?? 'event',
    type,
    id: options.id ?? randomUUID(),
    at: options.at ?? new Date().toISOString(),
    ...(options.meta ? { meta: options.meta } : {}),
    data,
  };
}
