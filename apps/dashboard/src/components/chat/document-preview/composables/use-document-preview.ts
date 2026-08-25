import { ref, watch } from 'vue';

import { loadDocumentPreviewContent } from '../helpers/load-document-preview-content.helper';

export interface DocumentPreviewItem {
  name: string;
  url: string;
}

/**
 * Owns the document preview modal: which document is open, and the content
 * it renders. Documents load their server-built preview (docx → sanitized
 * html, pptx → slide text, the rest → the original's text). PDFs never open
 * here — their pages render as image tiles with the image lightbox.
 */
export function useDocumentPreview() {
  const isOpen = ref(false);
  const item = ref<DocumentPreviewItem | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const html = ref<string | null>(null);
  const text = ref<string | null>(null);

  function open(next: DocumentPreviewItem) {
    item.value = next;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  watch(
    item,
    async (current) => {
      if (!current) return;
      isLoading.value = true;
      error.value = null;
      html.value = null;
      text.value = null;
      try {
        const content = await loadDocumentPreviewContent(
          current.url,
          current.name,
        );
        html.value = content.html ?? null;
        text.value = content.text ?? null;
      } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
      } finally {
        isLoading.value = false;
      }
    },
    { immediate: true },
  );

  return {
    isOpen,
    item,
    isLoading,
    error,
    html,
    text,
    open,
    close,
  };
}
