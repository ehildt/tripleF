import { SocketIOService } from '@triplef/socketio';

import { buildSocketEvent } from '../../socket-io/helpers/build-socket-event.helper.js';

/**
 * Envelope `type` values for the harness pipeline — a `domain:action`
 * convention from docs/socket-event-bus.md. These are envelope TYPES, not
 * socket.io channels: every emission still goes out on the conversation's
 * own channel (its `event` name) and room exactly as before; only the
 * payload shape changed.
 */
export const HARNESS_EVENT_TYPES = {
  activity: 'harness:activity',
  delta: 'harness:delta',
  toolCall: 'harness:tool-call',
  chart: 'harness:chart',
  completed: 'harness:completed',
  failed: 'harness:failed',
  cancelled: 'harness:cancelled',
} as const;

type HarnessEventType =
  (typeof HARNESS_EVENT_TYPES)[keyof typeof HARNESS_EVENT_TYPES];

/**
 * Emit a harness pipeline event: the v1 envelope is the PAYLOAD on the
 * conversation's existing channel/room. `channel` comes from `ctx.event`;
 * when it is unset the legacy default channel 'harness' is used (same
 * fallback the pre-envelope helper applied). See docs/socket-event-bus.md.
 */
export async function emitHarnessEvent(
  io: SocketIOService,
  channel: string | undefined,
  roomId: string | undefined,
  requestId: string,
  type: HarnessEventType,
  data: unknown,
): Promise<void> {
  try {
    const channelName = channel || 'harness';
    const envelope = buildSocketEvent(type, data, {
      meta: {
        requestId,
        ...(roomId ? { roomId } : {}),
      },
    });
    if (roomId) io.emitTo(channelName, roomId, envelope);
    else io.emit(channelName, envelope);
  } catch {
    // intentional — a socket hiccup must never fail the pipeline step.
  }
}
