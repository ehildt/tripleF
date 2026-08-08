import { useClipboard } from '@vueuse/core';
import { computed } from 'vue';

import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';

import type { ChatExchangeProps } from '../ChatExchange.types';
import { buildExchangeCopyText } from '../helpers/build-exchange-copy-text.helper';

export interface ChatExchangeEmits {
  (e: 'delete', exchangeId: string): void;
  (e: 'retry', exchangeId: string): void;
  (e: 'branch', exchangeId: string): void;
  (e: 'toggle-included', exchangeId: string): void;
  (e: 'hover-delete-start', exchangeId: string): void;
  (e: 'hover-delete-end'): void;
}

/**
 * Owns the exchange row's behavior: the role/status flags, the copy action,
 * the lightbox, and the store-backed toggle/cancel handlers.
 */
export function useChatExchange(
  props: ChatExchangeProps,
  emit: ChatExchangeEmits,
) {
  const appStore = useAppStore();
  const conversationStore = useConversationStore();

  const isUser = computed(() => props.exchange.role === 'user');
  const isPending = computed(() => props.exchange.status === 'pending');
  const isStreaming = computed(() => props.exchange.status === 'streaming');
  const isError = computed(() => props.exchange.status === 'error');
  const isDone = computed(() => props.exchange.status === 'done');

  const { copy } = useClipboard({ legacy: true });
  const lightbox = useLightbox();

  async function handleCopy() {
    await copy(buildExchangeCopyText(props.exchange));
  }

  function handleImageClicked(
    items: { url: string; title?: string }[],
    clickedUrl: string,
  ) {
    lightbox.openImages(items, clickedUrl);
  }

  function handleSelectIndex(i: number) {
    lightbox.index.value = i;
  }

  function handleToggleIncluded() {
    if (conversationStore.activeConversationId) {
      conversationStore.toggleExchangeIncluded(
        conversationStore.activeConversationId,
        props.exchange.id,
      );
      emit('toggle-included', props.exchange.id);
    }
  }

  function handleCancel(requestId: string) {
    appStore.abortJob(requestId);
  }

  return {
    isUser,
    isPending,
    isStreaming,
    isError,
    isDone,
    lightbox,
    handleCopy,
    handleImageClicked,
    handleSelectIndex,
    handleToggleIncluded,
    handleCancel,
  };
}
