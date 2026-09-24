import type { Ref } from 'vue';

export interface UseChatActionsOptions {
  userExchanges: Ref<Array<{ id: string; role: string; content: string }>>;
}
