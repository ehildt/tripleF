import type { Ref } from 'vue';

import type { SocketDebugEntry } from '../../../types/socket-debug-entry.model';

export interface EventListenerDependencies {
  socketId: Ref<string | null>;
  loggedRequestIds: Ref<Set<string>>;
  onMessage: ((event: string, data: unknown) => void) | null;
  onDebugEntry: ((entry: SocketDebugEntry) => void) | null;
}
