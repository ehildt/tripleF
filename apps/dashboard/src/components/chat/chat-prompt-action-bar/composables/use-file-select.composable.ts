import { computed, ref } from 'vue';

import { useAttachedFilesStore } from '@/stores/attached-files';
import { useModelsStore } from '@/stores/models';

import { useChatConversation } from '../../composables/use-chat-conversation';
import type { FileInputRef, SetFileInputRef } from './use-file-select.types';

const ACCEPTED_FILE_TYPES = 'image/*,.pdf,.docx,.pptx,.txt,.md,.csv,.json,.log';

/**
 * The prompt bar's file picker: the hidden FileInput triggered by the
 * "Select files" button, plus the handler that feeds the picked files into
 * the attached-files store. Parsing the native pick and resetting the input
 * live in FileInput; this composable only clicks it and receives the files.
 *
 * Derives the disabled gate itself (no model picked, or the model lacks
 * vision) by importing the active conversation and models store, so the bar
 * does not forward the gate in as an argument.
 */
export function useFileSelect() {
  const attachedFilesStore = useAttachedFilesStore();
  const modelsStore = useModelsStore();
  const { conversation, selectedModelObj } = useChatConversation();

  /** Name-based so the gate never disables while the catalog is still
   *  loading (a selected model whose entry has not resolved yet must still
   *  read as "has a model"). */
  const selectedModelName = computed(
    () => conversation.value?.model || modelsStore.selectedModel,
  );
  const hasNoModelSelected = computed(() => !selectedModelName.value);

  /** Vision capability; models without reported capabilities are allowed
   *  until their details load, matching the chat model-sync semantics. */
  const supportsVision = computed(
    () => selectedModelObj.value?.capabilities?.includes('vision') ?? true,
  );

  const isFileSelectDisabled = computed(
    () => hasNoModelSelected.value || !supportsVision.value,
  );

  const fileInputRef = ref<FileInputRef | null>(null);

  const setFileInputRef: SetFileInputRef = (el) => {
    fileInputRef.value = el as FileInputRef | null;
  };

  function triggerFileSelect() {
    if (isFileSelectDisabled.value) return;
    fileInputRef.value?.inputRef?.click();
  }

  function onFilesSelect(files: File[]) {
    attachedFilesStore.addFiles(files);
  }

  return {
    isFileSelectDisabled,
    acceptedFileTypes: ACCEPTED_FILE_TYPES,
    setFileInputRef,
    triggerFileSelect,
    onFilesSelect,
  };
}
