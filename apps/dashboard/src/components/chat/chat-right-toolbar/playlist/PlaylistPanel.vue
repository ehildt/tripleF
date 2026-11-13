<script setup lang="ts">
/**
 * The player shared by the chat right toolbar (docked) and the app-level
 * floating playlist: transport bar, active playlist name, playlists menu,
 * and the queued-video list with its empty state. Both surfaces show the
 * session's playlists and the same "now playing" treatment (the marquee
 * scrolls inside the active item row; the transport bar shows no separate
 * marquee).
 *
 * Surfaces mount it only while they own the playlist (floating mode is
 * mutually exclusive with the docked playlist), so the shared playlist state
 * is never touched by two panels at once. Extra toolbar actions (the
 * floating player's collapse button) slot in after the playlists menu.
 */
import { storeToRefs } from 'pinia';

import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';
import { usePlaylistCatalog } from '@/composables/use-playlist-catalog/use-playlist-catalog';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { usePlaylistTransport } from '../composables/use-playlist-transport';
import { usePlaylistFileTransfer } from './composables/use-playlist-file-transfer';
import { usePlaylistLibrary } from './composables/use-playlist-library';
import { usePlaylistPanel } from './composables/use-playlist-panel';
import PlaylistEmptyState from './playlist-empty-state/PlaylistEmptyState.vue';
import PlaylistQueue from './playlist-queue/PlaylistQueue.vue';
import PlaylistToolbar from './playlist-toolbar/PlaylistToolbar.vue';

const emit = defineEmits<{
  /** A video was launched from the queue; the owner may react (e.g. the
   *  floating player autocloses its window on pick). */
  play: [item: VideoGalleryItem];
}>();

const { hasQueuedVideos } = usePlaylistPanel();
const playlistStore = usePlaylistStore();
const {
  activePlaylistVideos: playlistVideos,
  playlistNames,
  activePlaylistName,
} = storeToRefs(playlistStore);
const { removeVideoFromActivePlaylist } = usePlaylistCatalog();

const playback = usePlaybackSession();
const {
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  playlistAutoplayEnabled,
  requestPlaybackToggle: toggleActivePlayback,
  stopPlayback: stopActivePlayback,
  togglePlaylistAutoplay,
} = playback;

const {
  activePlaybackTitle,
  popoutHidden,
  hasActivePlayback,
  canTogglePlayback,
  playbackToggleTitle,
  toggleHideOnPlaylist,
  onPlayItem,
} = usePlaylistTransport();

const {
  playlistNameInput,
  selectPlaylist,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
} = usePlaylistLibrary();

const { savePlaylistToFile, loadPlaylistFromFile } = usePlaylistFileTransfer();

function onItemPlay(item: VideoGalleryItem) {
  onPlayItem(item);
  emit('play', item);
}
</script>

<template>
  <div class="playlist-panel">
    <PlaylistToolbar
      v-model:playlist-name="playlistNameInput"
      :playing="activePlaybackPlaying"
      :can-toggle-playback="canTogglePlayback"
      :playback-toggle-title="playbackToggleTitle"
      :has-active-playback="hasActivePlayback"
      :autoplay-enabled="playlistAutoplayEnabled"
      :popout-hidden="popoutHidden"
      :now-playing-title="activePlaybackTitle"
      :active-playlist-name="activePlaylistName"
      :playlists="playlistNames"
      @toggle-playback="toggleActivePlayback"
      @stop-playback="stopActivePlayback"
      @toggle-autoplay="togglePlaylistAutoplay"
      @toggle-popout-visibility="toggleHideOnPlaylist"
      @select="selectPlaylist"
      @load-file="loadPlaylistFromFile"
      @save-file="savePlaylistToFile"
      @create="createPlaylist"
      @delete="deletePlaylist"
      @rename="renamePlaylist"
    >
      <slot name="toolbar-actions" />
    </PlaylistToolbar>

    <PlaylistQueue
      v-if="hasQueuedVideos"
      :videos="playlistVideos"
      :active-video-url="activePlaybackVideoUrl"
      @play="onItemPlay"
      @remove="removeVideoFromActivePlaylist"
    />
    <PlaylistEmptyState v-else :has-playlists="playlistNames.length > 0" />
  </div>
</template>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: var(--spacing-0-5);
}
</style>
