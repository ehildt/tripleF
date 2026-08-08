import { inject, type InjectionKey } from 'vue';

import type { AppViewContext } from './use-app-view-context.types';

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
export const appViewContextKey: InjectionKey<AppViewContext> =
  Symbol('app-view-context');

export function useAppViewContext(): AppViewContext {
  return inject(appViewContextKey)!;
}
