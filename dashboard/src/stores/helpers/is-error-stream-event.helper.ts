import type { MessageData } from '../../types/message-data.model';

/**
 * The terminal error event of a stream: carries an error message and the
 * done flag.
 */
export function isErrorStreamEvent(data: MessageData): boolean {
  return data.error !== undefined && data.done === true;
}
