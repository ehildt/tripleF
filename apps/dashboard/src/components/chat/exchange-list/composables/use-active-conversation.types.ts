import type { ComputedRef } from 'vue';

import type { Exchange, useConversationStore } from '@/stores/conversation';

export type ActiveSession = ReturnType<
  ReturnType<typeof useConversationStore>['getConversation']
>;

export interface ActiveSessionData {
  activeConversation: ComputedRef<ActiveSession | null>;
  exchanges: ComputedRef<readonly Exchange[]>;
  activeAssistantExchangeId: ComputedRef<string | null>;
  activeAssistantResponseStarted: ComputedRef<boolean>;
  /** True while the main column should show the loading skeleton: before the
   * conversation list has hydrated, or while the active conversation's full
   * content is still being fetched. */
  isExchangesLoading: ComputedRef<boolean>;
}
