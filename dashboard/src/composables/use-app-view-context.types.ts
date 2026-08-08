import type { ComputedRef } from 'vue';

import type { DebugResult } from '../types/debug.model';
import type { SocketProvider } from '../types/socket-provider.model';

export interface AppViewContext {
  socketProvider: SocketProvider;
  viewModels: ComputedRef<string[]>;
  debugResults: ComputedRef<DebugResult[]>;
  selectedDebugResult: ComputedRef<DebugResult | null>;
  clearDebugResults: () => void;
  selectDebugResult: (result: DebugResult | null) => void;
  selectDebugMarkRead: (id: string) => void;
}
