import { watch } from 'vue';

import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';

import { usePendingAttachments } from '../shared/composables/use-pending-attachments';

/**
 * Preserve selected pending-file metadata on the active conversation. Chat is
 * kept alive across tab switches, so this watcher retains the old store-level
 * lifetime without making application boot instantiate the conversation store.
 */
export function useAttachmentConversationSync(): void {
  const conversationSession = useConversationSession();
  const configuration = useConversationConfiguration();
  const { selectedFiles } = usePendingAttachments();

  watch(
    selectedFiles,
    (files) => {
      void configuration.setSavedFileInfos(
        conversationSession.activeConversationId.value ?? '',
        files,
      );
    },
    { deep: true },
  );
}
