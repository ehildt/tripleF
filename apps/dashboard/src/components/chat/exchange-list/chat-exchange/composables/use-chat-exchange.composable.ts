import { useClipboard } from '@vueuse/core';
import { computed } from 'vue';

import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import { useAppStore } from '@/stores/app';

import { useDocumentPreview } from '../../../document-preview/composables/use-document-preview';
import type { ChatExchangeProps } from '../ChatExchange.types';
import { useAddImageToFiles } from '../exchange-content/assistant-response/composables/use-add-image-to-files.composable';
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
  const documentPreview = useDocumentPreview();

  async function handleCopy() {
    await copy(buildExchangeCopyText(props.exchange));
  }

  function handleImageClicked(
    items: { url: string; title?: string }[],
    clickedUrl: string,
  ) {
    lightbox.openImages(items, clickedUrl);
  }

  function handleDocumentClicked(document: { name: string; url: string }) {
    documentPreview.open(document);
  }

  function handleSelectIndex(i: number) {
    lightbox.index.value = i;
  }

  // The lightbox's add-to-files button follows the image currently shown:
  // stored web images offer the add action, everything else (user uploads,
  // external links) hides it.
  const addToFiles = useAddImageToFiles(
    computed(() => {
      const image = lightbox.images.value[lightbox.index.value] ?? null;
      if (!image) return null;
      return { imageUrl: image.url, title: image.title, source: image.source };
    }),
  );

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
    documentPreview,
    addToFiles,
    handleCopy,
    handleImageClicked,
    handleDocumentClicked,
    handleSelectIndex,
    handleCancel,
  };
}
