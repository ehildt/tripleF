import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { conversationHasVideos } from '@/stores/chat/conversation/helpers/conversation-has-videos.helper';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import type { PlaylistTabState } from './use-playlist-tab.types';

/**
 * Whether the chat right toolbar's playlist tab has content — and thus shows
 * its tab. Richer than the panel's queue check: the tab is also available
 * while any playlist exists, while a playlist video is launched, and (in
 * panel mode) while the conversation's responses contain videos. The queued
 * list itself drops in floating mode, but the other signals keep the tab.
 */
export function usePlaylistTab(): PlaylistTabState {
  const playback = usePlaybackSession();
  const conversationStore = useConversationStore();
  const conversationSession = useConversationSession();
  const playlistStore = usePlaylistStore();
  const playlistSettingsStore = usePlaylistSettingsStore();
  const { activePlaylistVideos: playlistVideos } = storeToRefs(playlistStore);

  const activeConversation = computed(() => {
    const id = conversationSession.activeConversationId.value;
    if (!id) return null;
    return conversationStore.getConversation(id) ?? null;
  });

  /** The queued-video list drops entirely in floating mode. */
  const panelPlaylistVideos = computed<VideoGalleryItem[]>(() =>
    playlistSettingsStore.playlistMode === 'floating'
      ? []
      : playlistVideos.value,
  );

  const hasPlaylist = computed(
    () =>
      panelPlaylistVideos.value.length > 0 ||
      playlistStore.playlists.length > 0 ||
      (playback.launchedFromPlaylist.value &&
        Boolean(playback.launchedVideo.value)) ||
      (playlistSettingsStore.playlistMode !== 'floating' &&
        conversationHasVideos(activeConversation.value)),
  );

  return { hasPlaylist };
}
