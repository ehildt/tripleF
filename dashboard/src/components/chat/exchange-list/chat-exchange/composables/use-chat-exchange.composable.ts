import { useClipboard } from '@vueuse/core';
import { computed } from 'vue';

import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import { useAppStore } from '@/stores/app';

import type { ChatExchangeProps } from '../ChatExchange.types';
import { buildExchangeCopyText } from '../helpers/build-exchange-copy-text.helper';

export interface ChatExchangeEmits {
  (e: 'retry', exchangeId: string): void;
}

/**
 * Owns the exchange row's behavior: the role/status flags, the copy action,
 * the lightbox, and the store-backed cancel handler. Delete, branch, and the
 * include/merge toggles live on the right-panel history items, not here.
 */
export function useChatExchange(props: ChatExchangeProps) {
  const appStore = useAppStore();

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
    handleCancel,
  };
}
