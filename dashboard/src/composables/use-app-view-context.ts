import { inject, type InjectionKey } from 'vue';

import type { DebugResult } from '@/types/debug.model';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * Runtime data shared with the top-level views rendered by the router.
 * The app root (`App.vue`) builds this from the stores and provides it, so
 * route components stay presentational — they consume what they need and
 * never reach into stores themselves.
 */
export interface AppViewContext {
  socketProvider: SocketProvider;
  viewModels: string[];
  debugResults: DebugResult[];
  selectedDebugResult: DebugResult | null;
  clearDebugResults: () => void;
  selectDebugResult: (result: DebugResult | null) => void;
  selectDebugMarkRead: (id: string) => void;
}

export const appViewContextKey: InjectionKey<AppViewContext> =
  Symbol('app-view-context');

export function useAppViewContext(): AppViewContext {
  return inject(appViewContextKey)!;
}
