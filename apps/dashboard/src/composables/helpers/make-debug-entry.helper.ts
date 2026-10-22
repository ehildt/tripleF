import type { SocketDebugEntry } from '../../types/socket-debug-entry.model';

export function makeDebugEntry(
  partial: Omit<
    SocketDebugEntry,
    'type' | 'responseTime' | 'conversationId'
  > & {
    responseTime?: number;
    conversationId?: string | null;
  },
): SocketDebugEntry {
  return {
    type: 'socket',
    responseTime: partial.responseTime ?? 0,
    conversationId: partial.conversationId ?? undefined,
    ...partial,
  } as SocketDebugEntry;
}
