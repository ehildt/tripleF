import { useChatViewStore } from '@/stores/chat-view';

import type { UseChatActionsOptions } from './use-chat-actions.types';

/**
 * Wires the right-toolbar history-item click to a scroll request the
 * exchange list consumes (via the chat-view store) instead of a defineExpose
 * chain.
 */
export function useChatActions(options: UseChatActionsOptions) {
  const chatViewStore = useChatViewStore();
  const { userExchanges } = options;

  function onPromptClick(idx: number) {
    const id = userExchanges.value[idx]?.id;
    if (id) chatViewStore.requestScrollToExchange(id);
  }

  return { onPromptClick };
}
