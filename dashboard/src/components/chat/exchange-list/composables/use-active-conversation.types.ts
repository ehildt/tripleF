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
}
