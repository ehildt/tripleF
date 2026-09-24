import { inject, type InjectionKey } from 'vue';

import type { AppViewContext } from './use-app-view-context.types';

/**
 * App-level service singleton provided by `App.vue`. The socket provider
 * wraps the socket/messages/debug stores into an imperative controller and is
 * the one legitimate provide/inject in the tree — a service, not shared
 * reactive state. Route views inject it to stay presentational instead of
 * reaching into stores.
 */
export const appViewContextKey: InjectionKey<AppViewContext> =
  Symbol('app-view-context');

export function useAppViewContext(): AppViewContext {
  return inject(appViewContextKey)!;
}
