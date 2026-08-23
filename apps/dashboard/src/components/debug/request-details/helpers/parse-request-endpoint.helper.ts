import type { DebugResult } from '../../../../types/debug.model';
import type { ParsedEndpoint } from './parse-request-endpoint.helper.types';
import { parseUrl } from './parse-url.helper';

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || '/socket.io';

/** Keys that we display as DetailTag chips in the property table. */
const URL_PARAMS_FILTERED_OUT = new Set([
  'requestId',
  'numCtx',
  'model',
  'roomId',
  'conversationId',
  'event',
  'stream',
  'preprocessing',
]);

/**
 * Parse a DebugResult's endpoint into the parts we display in the
 * request details panel.
 */
export function parseRequestEndpoint(
  result: DebugResult | null,
): ParsedEndpoint {
  const raw = result?.endpoint ?? '';
  if (result?.type === 'socket') {
    const parts = raw.replace('socket.io:', '').split(':');
    return {
      path: SOCKET_BASE_URL,
      event: parts[0] || '',
      room: parts[2] || undefined,
      params: [],
    };
  }
  const parsed = parseUrl(raw);
  return {
    path: parsed.path,
    event: '',
    params: parsed.params.filter((p) => !URL_PARAMS_FILTERED_OUT.has(p.key)),
  };
}
