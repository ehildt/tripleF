import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * View-model store for the chat view: the id of the user exchange whose
 * section is currently active in the carousel/native scroll list, plus the
 * one-shot scroll request the right-toolbar history fires to jump the list to
 * a specific exchange.
 *
 * Both sides talk to this store instead of a defineExpose chain: the scroll
 * list writes the active exchange id, and the history panel writes the scroll
 * request (which the scroll list consumes).
 */
export const useChatViewStore = defineStore('chatView', () => {
  const activeUserExchangeId = ref<string | null>(null);

  function setActiveUserExchangeId(id: string | null) {
    activeUserExchangeId.value = id;
  }

  /** One-shot scroll request. `requestId` increments per request so a repeat
   * click on the already-active exchange still re-scrolls it to the top. */
  const scrollToExchangeRequest = ref<{
    exchangeId: string;
    requestId: number;
  } | null>(null);
  let nextRequestId = 0;

  function requestScrollToExchange(exchangeId: string) {
    scrollToExchangeRequest.value = {
      exchangeId,
      requestId: ++nextRequestId,
    };
  }

  return {
    activeUserExchangeId,
    setActiveUserExchangeId,
    scrollToExchangeRequest,
    requestScrollToExchange,
  };
});
