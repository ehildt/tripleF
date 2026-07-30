import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';

import { getApiUrl } from '../../../../api/api-url';
import type { AttachmentItem } from './use-attachment-list';

/**
 * Panel-level state for the chat right panel: which tabs exist and
 * attachment preview URLs. Tab styling lives in RightPanelTabs; playback
 * state for the playlist lives in use-playlist-transport.
 */
export function useRightPanel(props: {
  attachments: AttachmentItem[];
  messageListItems: readonly unknown[];
  playlistVideos: readonly unknown[];
  conversation: Conversation | null;
}) {
  const hasAttachments = computed(() => props.attachments.length > 0);
  const hasHistory = computed(() => props.messageListItems.length > 0);
  const hasPlaylist = computed(() => props.playlistVideos.length > 0);

  function previewUrl(item: AttachmentItem): string {
    if (!item.isUploaded) return item.previewUrl;
    if (!props.conversation?.id) return '';
    return getApiUrl(
      `/api/v1/storage/${props.conversation.id}/${props.conversation.conversationId}/${item.hash}`,
    );
  }

  return {
    hasAttachments,
    hasHistory,
    hasPlaylist,
    previewUrl,
  };
}
