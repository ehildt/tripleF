import { watch } from 'vue';

import { useConversationStore } from '@/stores/conversation/conversation.store';

import { usePendingAttachments } from '../shared/composables/use-pending-attachments';

/**
 * Preserve selected pending-file metadata on the active conversation. Chat is
 * kept alive across tab switches, so this watcher retains the old store-level
 * lifetime without making application boot instantiate the conversation store.
 */
export function useAttachmentConversationSync(): void {
  const conversationStore = useConversationStore();
  const { selectedFiles } = usePendingAttachments();

  watch(
    selectedFiles,
    (files) => {
      conversationStore.setSavedFileInfos(
        conversationStore.activeConversationId ?? '',
        files,
      );
    },
    { deep: true },
  );
}
