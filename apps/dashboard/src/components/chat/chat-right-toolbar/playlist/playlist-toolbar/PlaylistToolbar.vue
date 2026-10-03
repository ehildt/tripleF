<script setup lang="ts">
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import PlaylistMenu from '@/components/widgets/floating-playlist/playlist-menu/PlaylistMenu.vue';

import PlaylistTransportBar from '../playlist-transport-bar/PlaylistTransportBar.vue';
import type { PlaylistToolbarProps } from './PlaylistToolbar.types';

defineProps<PlaylistToolbarProps>();

const emit = defineEmits<{
  togglePlayback: [];
  stopPlayback: [];
  toggleAutoplay: [];
  togglePopoutVisibility: [];
  'update:playlistName': [name: string];
  select: [name: string];
  create: [];
  rename: [oldName: string, newName: string];
  delete: [name: string];
}>();
</script>

<template>
  <div class="playlist-toolbar">
    <div class="playlist-toolbar__row">
      <PlaylistTransportBar
        :playing="playing"
        :can-toggle-playback="canTogglePlayback"
        :playback-toggle-title="playbackToggleTitle"
        :has-active-playback="hasActivePlayback"
        :autoplay-enabled="autoplayEnabled"
        :popout-hidden="popoutHidden"
        :now-playing-title="nowPlayingTitle"
        :show-now-playing="false"
        @toggle-playback="emit('togglePlayback')"
        @stop-playback="emit('stopPlayback')"
        @toggle-autoplay="emit('toggleAutoplay')"
        @toggle-popout-visibility="emit('togglePopoutVisibility')"
      />
      <Tooltip
        :text="$t('common.activePlaylist', { name: activePlaylistName })"
      >
        <span v-if="activePlaylistName" class="playlist-toolbar__name">{{
          activePlaylistName
        }}</span>
      </Tooltip>
      <PlaylistMenu
        :playlist-name="playlistName"
        :playlists="playlists"
        :active-playlist-name="activePlaylistName"
        @update:playlist-name="emit('update:playlistName', $event)"
        @select="emit('select', $event)"
        @create="emit('create')"
        @delete="emit('delete', $event)"
        @rename="(oldName, newName) => emit('rename', oldName, newName)"
      />
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Header strip holding the toolbar — the glassy tone of the floating player
   (elevated surface over the window, no border). */
.playlist-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1-5);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  user-select: none;
}

.playlist-toolbar__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* The transport bar fills the row; the name, menu, and any slotted actions
   sit at the right. */
.playlist-toolbar__row > :first-child {
  flex: 1;
  min-width: 0;
}

.playlist-toolbar__name {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}
</style>
