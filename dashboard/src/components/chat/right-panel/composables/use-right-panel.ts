import { computed } from 'vue';

import { playlistMode } from '@/components/widgets/floating-playlist/composables/playlist-settings.state';
import { savedPlaylists } from '@/components/widgets/floating-playlist/composables/saved-playlists.state';
import type { Conversation } from '@/stores/conversation';

import { getApiUrl } from '../../../../api/api-url';
import { conversationHasVideos } from '../../composables/conversation-has-videos.helper';
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
  // The player is shown when it holds anything the user can act on: at least
  // one added video, a saved playlist to load from an empty queue, or — in
  // docked mode — a conversation that contains videos (so the empty state
  // and its hints are reachable).
  const hasPlaylist = computed(
    () =>
      props.playlistVideos.length > 0 ||
      savedPlaylists.value.length > 0 ||
      (playlistMode.value !== 'floating' &&
        conversationHasVideos(props.conversation)),
  );

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
