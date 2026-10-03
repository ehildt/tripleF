import { computed } from 'vue';

import { usePlaybackSession } from '@/composables/use-playback-session';
import { useConversationStore } from '@/stores/conversation';
import { conversationHasVideos } from '@/stores/helpers/conversation/conversation-has-videos.helper';
import { usePlaylistStore } from '@/stores/playlist';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * Whether the chat right toolbar's playlist tab has content — and thus shows
 * its tab. Richer than the panel's queue check: the tab is also available
 * while any playlist exists, while a playlist video is launched, and (in
 * panel mode) while the conversation's responses contain videos. The queued
 * list itself drops in floating mode, but the other signals keep the tab.
 */
export function usePlaylistTab() {
  const playback = usePlaybackSession();
  const conversationStore = useConversationStore();
  const playlistStore = usePlaylistStore();

  const activeConversation = computed(() => {
    const id = conversationStore.activeConversationId;
    if (!id) return null;
    return conversationStore.getConversation(id) ?? null;
  });

  const playlistVideos = computed<VideoGalleryItem[]>(() =>
    playlistStore.getActivePlaylistVideos(),
  );

  /** The queued-video list drops entirely in floating mode. */
  const panelPlaylistVideos = computed<VideoGalleryItem[]>(() =>
    playlistStore.playlistMode === 'floating' ? [] : playlistVideos.value,
  );

  const hasPlaylist = computed(
    () =>
      panelPlaylistVideos.value.length > 0 ||
      playlistStore.getPlaylists().length > 0 ||
      (playback.launchedFromPlaylist.value &&
        Boolean(playback.launchedVideo.value)) ||
      (playlistStore.playlistMode !== 'floating' &&
        conversationHasVideos(activeConversation.value)),
  );

  return { hasPlaylist };
}
