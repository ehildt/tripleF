import { type ComputedRef, inject, type InjectionKey } from 'vue';

import type { DebugResult } from '@/types/debug.model';
import type { SocketProvider } from '@/types/socket-provider.model';

/**
 * Runtime data shared with the top-level views rendered by the router.
 * The app root (`App.vue`) builds this from the stores and provides it, so
 * route components stay presentational — they consume what they need and
 * never reach into stores themselves.
 *
 * Store-derived fields are provided as reactive `ComputedRef`s: the root
 * provides a snapshot otherwise, and route views (Debug details, DLQ model
 * selector) would render stale values forever. Consumers read them in
 * templates, where refs auto-unwrap.
 */
export interface AppViewContext {
  socketProvider: SocketProvider;
  viewModels: ComputedRef<string[]>;
  debugResults: ComputedRef<DebugResult[]>;
  selectedDebugResult: ComputedRef<DebugResult | null>;
  clearDebugResults: () => void;
  selectDebugResult: (result: DebugResult | null) => void;
  selectDebugMarkRead: (id: string) => void;
}

export const appViewContextKey: InjectionKey<AppViewContext> =
  Symbol('app-view-context');

export function useAppViewContext(): AppViewContext {
  return inject(appViewContextKey)!;
}
