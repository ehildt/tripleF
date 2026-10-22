import { ref } from 'vue';

/**
 * View-model state for the chat view: the id of the user exchange whose
 * section is currently active in the carousel/native scroll list, plus the
 * one-shot scroll request the right-toolbar history fires to jump the list to
 * a specific exchange.
 *
 * This is a module-scope singleton (rule 20): the scroll list and the history
 * panel must share one source of truth regardless of which component asks,
 * so the state lives at module scope and every call sees the same refs. The
 * spec resets the refs between tests. Both sides used to talk through a
 * Pinia store; the store only controlled these refs, so it is a composable.
 */
const activeUserExchangeId = ref<string | null>(null);

/** One-shot scroll request. `requestId` increments per request so a repeat
 * click on the already-active exchange still re-scrolls it to the top. */
const scrollToExchangeRequest = ref<{
  exchangeId: string;
  requestId: number;
} | null>(null);
let nextRequestId = 0;

export function useChatView() {
  function setActiveUserExchangeId(id: string | null) {
    activeUserExchangeId.value = id;
  }

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
}
