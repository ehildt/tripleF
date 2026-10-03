import { parseSocketEvent } from '../../../composables/helpers/parse-socket-event.helper';
import type { EventListenerDependencies } from './create-event-listener.helper.types';
import { makeDebugEntry } from './make-debug-entry.helper';

/**
 * Build the callback attached to a socket channel. Each payload is parsed
 * against the v1 envelope contract (docs/socket-event-bus.md); valid
 * envelopes are forwarded to the message store so its typed dispatcher can
 * route by `envelope.type`, then logged into the socket debug log: one DATA
 * entry per request id and a DONE entry when the final (completed) event
 * carries token statistics. Payloads that are not valid envelopes (e.g. a
 * manually subscribed foreign channel) are forwarded raw, unlogged.
 */
export function createEventListener(
  channelName: string,
  deps: EventListenerDependencies,
): (raw: unknown) => void {
  const { socketId, loggedRequestIds, onMessage, onDebugEntry } = deps;

  return (raw: unknown) => {
    const envelope = parseSocketEvent(raw);

    // Route to the message store. Envelopes are dispatched by their `type`;
    // raw (non-envelope) payloads still reach the store so a manually
    // subscribed foreign channel keeps its debug entry.
    onMessage?.(channelName, envelope ?? raw);

    if (!envelope) return;

    const requestId = envelope.meta?.requestId;
    if (!requestId) return;

    // First DATA event per requestId
    if (!loggedRequestIds.value.has(requestId)) {
      loggedRequestIds.value.add(requestId);
      onDebugEntry?.(
        makeDebugEntry({
          endpoint: `socket.io:${channelName}`,
          method: 'DATA',
          status: 'success',
          direction: 'response',
          requestId,
          roomId: envelope.meta?.roomId,
          event: envelope.type,
          conversationId: socketId.value || undefined,
        }),
      );
    }

    // Final event with token data — the completed envelope carries usage.
    if (envelope.type === 'harness:completed') {
      const usage = (
        envelope.data as
          | { usage?: { promptEvalCount?: number; evalCount?: number } }
          | undefined
      )?.usage;
      if (usage && (usage.promptEvalCount != null || usage.evalCount != null)) {
        onDebugEntry?.(
          makeDebugEntry({
            endpoint: `socket.io:${channelName}`,
            method: 'DONE',
            status: 'success',
            direction: 'response',
            requestId,
            roomId: envelope.meta?.roomId,
            event: envelope.type,
            conversationId: socketId.value || undefined,
            promptEvalCount: usage.promptEvalCount,
            evalCount: usage.evalCount,
          }),
        );
      }
    }
  };
}
