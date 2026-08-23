import type { EventListenerDependencies } from './create-event-listener.helper.types';
import { makeDebugEntry } from './make-debug-entry.helper';

/**
 * Build the callback attached to a socket event. Every incoming payload is
 * stamped with the current session id and forwarded to the message store,
 * then logged into the socket debug log: one DATA entry per request id and
 * a DONE entry when the final event carries token statistics. Ollama's
 * snake_case token fields are normalized for the debug entry.
 */
export function createEventListener(
  eventName: string,
  deps: EventListenerDependencies,
): (data: unknown) => void {
  const { socketId, loggedRequestIds, onMessage, onDebugEntry } = deps;

  return (data: unknown) => {
    // Inject conversationId into the data before passing to message callback
    const dataWithSession = data as Record<string, unknown>;
    if (typeof dataWithSession === 'object' && dataWithSession !== null) {
      dataWithSession.conversationId = socketId.value;
    }

    // Route to message store - it will filter based on tracked request IDs
    onMessage?.(eventName, dataWithSession);

    // Normalize Ollama snake_case fields
    const raw = dataWithSession as Record<string, unknown>;
    const promptEvalCount = (raw.promptEvalCount ?? raw.prompt_eval_count) as
      number | undefined;
    const evalCount = (raw.evalCount ?? raw.eval_count) as number | undefined;
    const evalDuration = (raw.evalDuration ?? raw.eval_duration) as
      number | undefined;
    const totalDuration = (raw.totalDuration ?? raw.total_duration) as
      number | undefined;

    // Log socket data received in debug log
    const d = raw as unknown as {
      requestId?: string;
      roomId?: string;
      meta?: Array<{ requestId?: string }>;
      stream?: boolean;
      done?: boolean;
    };
    const requestId = d?.requestId || d?.meta?.[0]?.requestId;

    if (requestId) {
      // First DATA event per requestId
      if (!loggedRequestIds.value.has(requestId)) {
        loggedRequestIds.value.add(requestId);
        onDebugEntry?.(
          makeDebugEntry({
            endpoint: `socket.io:${eventName}`,
            method: 'DATA',
            status: 'success',
            direction: 'response',
            requestId: requestId,
            roomId: d?.roomId,
            event: eventName,
            stream: d?.stream,
            conversationId: socketId.value || undefined,
          }),
        );
      }
      // Final event with token data
      if (d?.done && (promptEvalCount != null || evalCount != null)) {
        onDebugEntry?.(
          makeDebugEntry({
            endpoint: `socket.io:${eventName}`,
            method: 'DONE',
            status: 'success',
            direction: 'response',
            requestId: requestId,
            roomId: d?.roomId,
            event: eventName,
            conversationId: socketId.value || undefined,
            promptEvalCount,
            evalCount,
            evalDuration,
            totalDuration,
          }),
        );
      }
    }
  };
}
