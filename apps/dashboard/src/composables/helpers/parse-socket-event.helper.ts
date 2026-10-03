import { z } from 'zod';

import type { SocketEvent } from '@/types/socket-event.model';

const socketEventMetaSchema = z.object({
  requestId: z.string().optional(),
  roomId: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * Root is strict: the envelope is a closed set and domain fields must never
 * leak to the root. `meta` stays open so future correlation ids are additive.
 */
const socketEventSchema = z
  .object({
    v: z.literal(1),
    kind: z.enum(['event', 'reply', 'command']),
    type: z.string(),
    id: z.string(),
    at: z.string(),
    meta: socketEventMetaSchema.optional(),
    data: z.unknown(),
  })
  .strict();

/**
 * Parse an inbound bus payload against the envelope schema. Returns null on
 * any mismatch — the caller drops malformed events (logged to the debug
 * stream, never thrown into the app). See docs/socket-event-bus.md.
 */
export function parseSocketEvent(payload: unknown): SocketEvent | null {
  const result = socketEventSchema.safeParse(payload);
  return result.success ? result.data : null;
}
