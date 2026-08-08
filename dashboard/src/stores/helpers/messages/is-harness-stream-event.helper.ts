import type { MessageData } from '../../../types/message-data.model';

/**
 * A harness stream event carries the template name plus incremental deltas
 * the response renderer assembles. Chart-series events (streamed right after
 * an EODHD tool runs) and the final done payload carry the template without
 * a text delta, so they must also be routed to the harness stream handler.
 *
 * Reasoning-delta and activity events also carry the template with
 * `done: false`, but they are NOT harness stream events — they must reach the
 * generic session bridge so `handleReasoningDelta` can populate the thinking.
 * That is why `done` is matched strictly as `=== true` rather than
 * `!== undefined`.
 */
export function isHarnessStreamEvent(data: MessageData): boolean {
  return (
    data.template !== undefined &&
    (data.delta !== undefined ||
      data.chartData !== undefined ||
      data.done === true)
  );
}
