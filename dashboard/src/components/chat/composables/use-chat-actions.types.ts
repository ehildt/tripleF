import type { Ref } from 'vue';

export interface ChatListRef {
  scrollToExchange: (id: string) => void;
}

export interface ToolbarRef {
  fileInputRef?: { click: () => void } | null;
  removeFile: (index: number) => void;
  toggleFileSelected: (index: number) => void;
}

export interface UseChatActionsOptions {
  chatListRef: Ref<ChatListRef | null>;
  userExchanges: Ref<Array<{ id: string; role: string; content: string }>>;
  toolbarRef: Ref<ToolbarRef | null>;
  hasNoModelSelected: Ref<boolean>;
  supportsVision: Ref<boolean>;
}
