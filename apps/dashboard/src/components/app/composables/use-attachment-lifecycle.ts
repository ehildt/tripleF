import { onUnmounted } from 'vue';

import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';

/**
 * Application-lifetime attachment disposal. Pending previews survive Chat
 * unmounts; only disposal of the application revokes every remaining URL.
 */
export function useAttachmentLifecycle(): void {
  const attachedFilesStore = useAttachedFilesStore();

  onUnmounted(() => {
    for (const entries of attachedFilesStore.pendingFilesByConversation.values())
      for (const entry of entries) URL.revokeObjectURL(entry.objectUrl);
    attachedFilesStore.clearPendingFiles();
  });
}
