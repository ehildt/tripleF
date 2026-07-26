import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';

import { getApiUrl } from '../../../../api/api-url';
import type { RightPanelView } from '../../composables/use-chat-panel';
import type { AttachmentItem } from './use-attachment-list';

/**
 * Panel-level state for the chat right panel: which tabs exist, the active
 * tab styling, and attachment preview URLs. Playback state for the
 * playlist lives in use-playlist-transport.
 */
export function useRightPanel(
  props: {
    attachments: AttachmentItem[];
    messageListItems: readonly unknown[];
    playlistVideos: readonly unknown[];
    rightPanelView: RightPanelView;
    conversation: Conversation | null;
  },
  emit: { promptClick: [index: number] },
) {
  const hasAttachments = computed(() => props.attachments.length > 0);
  const hasHistory = computed(() => props.messageListItems.length > 0);
  const hasPlaylist = computed(() => props.playlistVideos.length > 0);

  const filesTabClass = computed(() => ({
    'chat-right-panel__tab': true,
    'chat-right-panel__tab--active': props.rightPanelView === 'files',
  }));
  const playlistTabClass = computed(() => ({
    'chat-right-panel__tab': true,
    'chat-right-panel__tab--active': props.rightPanelView === 'playlist',
  }));
  const historyTabClass = computed(() => ({
    'chat-right-panel__tab': true,
    'chat-right-panel__tab--active': props.rightPanelView === 'history',
  }));

  function previewUrl(item: AttachmentItem): string {
    if (!item.isUploaded) return item.previewUrl;
    if (!props.conversation?.id) return '';
    return getApiUrl(
      `/api/v1/storage/${props.conversation.id}/${props.conversation.conversationId}/${item.hash}`,
    );
  }

  function onPromptClick(index: number) {
    emit('promptClick', index);
  }

  return {
    hasAttachments,
    hasHistory,
    hasPlaylist,
    filesTabClass,
    playlistTabClass,
    historyTabClass,
    previewUrl,
    onPromptClick,
  };
}
