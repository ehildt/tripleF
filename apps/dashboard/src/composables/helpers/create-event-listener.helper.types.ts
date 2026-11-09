import type { Ref } from 'vue';

import type { SocketDebugEntry } from '../../types/socket-debug-entry.model';

export interface EventListenerDependencies {
  /** Persistent application socket session id used in debug entries. */
  socketId: Ref<string | null>;
  /** Request ids that already have their first DATA debug entry. */
  loggedRequestIds: Ref<Set<string>>;
  /** Harness event consumer; null disables application event reduction. */
  onMessage: ((event: string, data: unknown) => void) | null;
  /** Debug log consumer; null disables socket debug entries. */
  onDebugEntry: ((entry: SocketDebugEntry) => void) | null;
}
