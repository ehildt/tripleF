import type { DebugResult } from '@/types/debug.model';
import type { SocketProvider } from '@/types/socket-provider.model';

export interface MockAppViewContextInput {
  socketProvider?: SocketProvider;
  viewModels?: string[];
  debugResults?: DebugResult[];
  selectedDebugResult?: DebugResult | null;
  clearDebugResults?: () => void;
  selectDebugResult?: (result: DebugResult | null) => void;
  selectDebugMarkRead?: (id: string) => void;
}
