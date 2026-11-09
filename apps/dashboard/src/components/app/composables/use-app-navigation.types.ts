import type { ComputedRef } from 'vue';

export interface AppNavigationState {
  /** Whether unread DLQ activity should be badged outside the DLQ route. */
  showDlqBadge: ComputedRef<boolean>;
}
