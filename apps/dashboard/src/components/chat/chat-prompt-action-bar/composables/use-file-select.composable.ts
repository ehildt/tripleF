import type { ComponentPublicInstance } from 'vue';
import { type Ref, ref } from 'vue';

import { useAttachedFilesStore } from '@/stores/attached-files';

const ACCEPTED_FILE_TYPES = 'image/*,.pdf,.docx,.pptx,.txt,.md,.csv,.json,.log';

/**
 * The prompt bar's file picker: the hidden file input triggered by the
 * "Select files" button, plus the change handler that feeds the picked files
 * into the attached-files store.
 */
export function useFileSelect(isFileSelectDisabled: Ref<boolean>) {
  const attachedFilesStore = useAttachedFilesStore();
  const fileInputRef = ref<HTMLInputElement | null>(null);

  function setFileInputRef(el: Element | ComponentPublicInstance | null) {
    fileInputRef.value = el as HTMLInputElement | null;
  }

  function triggerFileSelect() {
    if (isFileSelectDisabled.value) return;
    fileInputRef.value?.click();
  }

  function onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    attachedFilesStore.addFiles(input.files ? Array.from(input.files) : []);
    input.value = '';
  }

  return {
    acceptedFileTypes: ACCEPTED_FILE_TYPES,
    setFileInputRef,
    triggerFileSelect,
    onFileInputChange,
  };
}
