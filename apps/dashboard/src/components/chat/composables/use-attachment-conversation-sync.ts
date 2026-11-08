import { watch } from 'vue';

import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { usePendingAttachments } from '../shared/composables/use-pending-attachments';

/**
 * Preserve selected pending-file metadata on the active conversation. Chat is
 * kept alive across tab switches, so this watcher retains the old store-level
 * lifetime without making application boot instantiate the conversation store.
 */
export function useAttachmentConversationSync(): void {
  const conversationStore = useConversationStore();
  const configuration = useConversationConfiguration();
  const { selectedFiles } = usePendingAttachments();

  watch(
    selectedFiles,
    (files) => {
      void configuration.setSavedFileInfos(
        conversationStore.activeConversationId ?? '',
        files,
      );
    },
    { deep: true },
  );
}
