import { type Ref } from 'vue';

interface ChatListRef {
  scrollToExchange: (id: string) => void;
}

interface ToolbarRef {
  fileInputRef?: { click: () => void } | null;
  removeFile: (index: number) => void;
  toggleFileSelected: (index: number) => void;
}

interface UseChatActionsOptions {
  chatListRef: Ref<ChatListRef | null>;
  userExchanges: Ref<Array<{ id: string; role: string; content: string }>>;
  toolbarRef: Ref<ToolbarRef | null>;
  hasNoModelSelected: Ref<boolean>;
  supportsVision: Ref<boolean>;
}

/**
 * Provides the action handlers that wire user gestures in the chat view
 * to the toolbar and exchange-list template refs.
 */
export function useChatActions(options: UseChatActionsOptions) {
  const {
    chatListRef,
    userExchanges,
    toolbarRef,
    hasNoModelSelected,
    supportsVision,
  } = options;

  function scrollToExchange(id: string) {
    chatListRef.value?.scrollToExchange(id);
  }

  function onPromptClick(idx: number) {
    const id = userExchanges.value[idx]?.id;
    if (id) scrollToExchange(id);
  }

  function triggerFileSelect() {
    if (hasNoModelSelected.value || !supportsVision.value) return;
    toolbarRef.value?.fileInputRef?.click();
  }

  function onRemoveAttachedFile(index: number) {
    toolbarRef.value?.removeFile(index);
  }

  function onToggleAttachedFileSelected(index: number) {
    toolbarRef.value?.toggleFileSelected(index);
  }

  return {
    scrollToExchange,
    onPromptClick,
    triggerFileSelect,
    onRemoveAttachedFile,
    onToggleAttachedFileSelected,
  };
}
