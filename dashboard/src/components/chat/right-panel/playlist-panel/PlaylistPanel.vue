<script setup lang="ts">
/**
 * The player shared by the chat right panel (docked) and the app-level
 * floating playlist: transport bar, active playlist name, saved-playlists
 * menu, and the queued-video list with its empty state. The only input is
 * the queue key — the active conversation id when docked, the global
 * floating key when mounted in the floating player — so both surfaces get
 * the same behaviour and the same "now playing" treatment (the marquee
 * scrolls inside the active item row; the transport bar shows no separate
 * marquee).
 *
 * Surfaces mount it only while they own the playlist (floating mode is
 * mutually exclusive with the docked playlist), so the shared saved-playlist
 * state is never touched by two panels at once. Extra toolbar actions (the
 * floating player's collapse button) slot in after the saved-playlists menu
 * via `toolbar-actions`.
 */
import { computed } from 'vue';

import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import { usePlaylistLibrary } from '@/components/widgets/floating-playlist/composables/use-playlist-library';
import PlaylistMenu from '@/components/widgets/floating-playlist/playlist-menu/PlaylistMenu.vue';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { usePlaylistTransport } from '../composables/use-playlist-transport';
import { useVideoPlaylist } from '../composables/use-video-playlist';
import PlaylistItem from '../playlist-item/PlaylistItem.vue';
import PlaylistTransportBar from '../playlist-transport-bar/PlaylistTransportBar.vue';

const props = defineProps<{
  /** Queue key this panel shows: the active conversation id (docked) or the
   *  global floating key (mounted in the floating player). */
  conversationId: string;
}>();

const emit = defineEmits<{
  /** A video was launched from the queue; the owner may react (e.g. the
   *  floating player autocloses its window on pick). */
  play: [item: VideoGalleryItem];
}>();

const conversationId = computed(() => props.conversationId);

const { playlistVideos, hasPlaylist } = useVideoPlaylist(conversationId);

const {
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  activePlaybackTitle,
  playlistAutoplayEnabled,
  popoutHidden,
  hasActivePlayback,
  canTogglePlayback,
  playbackToggleTitle,
  toggleActivePlayback,
  stopActivePlayback,
  togglePlaylistAutoplay,
  toggleHideOnPlaylist,
  onPlayItem,
  onRemoveItem,
} = usePlaylistTransport(playlistVideos, conversationId);

const {
  playlistNameInput,
  savedPlaylistNames,
  activePlaylistName,
  selectPlaylist,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
} = usePlaylistLibrary(conversationId, playlistVideos);

function onItemPlay(item: VideoGalleryItem) {
  onPlayItem(item);
  emit('play', item);
}
</script>

<template>
  <div class="playlist-panel">
    <div class="playlist-panel__header">
      <div class="playlist-panel__toolbar">
        <PlaylistTransportBar
          :playing="activePlaybackPlaying"
          :can-toggle-playback="canTogglePlayback"
          :playback-toggle-title="playbackToggleTitle"
          :has-active-playback="hasActivePlayback"
          :autoplay-enabled="playlistAutoplayEnabled"
          :popout-hidden="popoutHidden"
          :now-playing-title="activePlaybackTitle"
          :show-now-playing="false"
          @toggle-playback="toggleActivePlayback"
          @stop-playback="stopActivePlayback"
          @toggle-autoplay="togglePlaylistAutoplay"
          @toggle-popout-visibility="toggleHideOnPlaylist"
        />
        <span
          v-if="activePlaylistName"
          class="playlist-panel__active-name"
          :title="`Active playlist: ${activePlaylistName}`"
          >{{ activePlaylistName }}</span
        >
        <PlaylistMenu
          :playlist-name="playlistNameInput"
          :playlists="savedPlaylistNames"
          :active-playlist-name="activePlaylistName"
          @update:playlist-name="playlistNameInput = $event"
          @select="selectPlaylist"
          @create="createPlaylist"
          @delete="deletePlaylist"
          @rename="renamePlaylist"
        />
        <slot name="toolbar-actions" />
      </div>
    </div>

    <div class="playlist-panel__body">
      <div v-if="hasPlaylist" class="playlist-panel__items">
        <PlaylistItem
          v-for="(item, index) in playlistVideos"
          :key="`${item.videoUrl}-${index}`"
          :item="item"
          :is-active="activePlaybackVideoUrl === item.videoUrl"
          @play="onItemPlay(item)"
          @remove="onRemoveItem(item.videoUrl)"
        />
      </div>
      <PanelEmptyState
        v-else
        message="No videos in the playlist"
        submessage="Add videos from a video card, or pick a saved playlist"
      />
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

/* Header strip holding the toolbar — the glassy tone of the floating player
   (elevated surface over the window, no border). */
.playlist-panel__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  user-select: none;
}

.playlist-panel__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* The transport bar fills the row; the name, menu, and any slotted actions
   sit at the right. */
.playlist-panel__toolbar > :first-child {
  flex: 1;
  min-width: 0;
}

.playlist-panel__active-name {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.playlist-panel__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.playlist-panel__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
