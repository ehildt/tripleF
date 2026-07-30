import type { MessageData } from '../../types/message-data.model';

/**
 * A harness stream event carries the template name plus incremental deltas
 * the response renderer assembles.
 */
export function isHarnessStreamEvent(data: MessageData): boolean {
  return data.template !== undefined && data.delta !== undefined;
}
