import { ref } from 'vue';

import { usePlaylistCatalog } from '@/composables/use-playlist-catalog/use-playlist-catalog';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';

import type { PlaylistLibraryControls } from './use-playlist-library.types';

/** Compose catalog mutations with playlist-panel input and notifications. */
export function usePlaylistLibrary(): PlaylistLibraryControls {
  const toast = useToast();
  const playlistStore = usePlaylistStore();
  const playlistCatalog = usePlaylistCatalog();

  /** Name being typed for a new playlist ('' once created — the field clears). */
  const playlistNameInput = ref('');

  function createPlaylist(): void {
    const name = playlistNameInput.value.trim();
    if (!name) return;
    const playlist = playlistCatalog.createPlaylist(name);
    if (!playlist) return;
    toast.info(i18n.global.t('toast.playlistCreated', { name: playlist.name }));
    playlistNameInput.value = '';
  }

  function deletePlaylist(name: string): void {
    if (!playlistCatalog.deletePlaylist(name)) return;
    toast.info(i18n.global.t('toast.playlistDeleted', { name }));
    if (playlistStore.activePlaylistName === name) {
      playlistNameInput.value = '';
    }
  }

  function renamePlaylist(oldName: string, newName: string): void {
    if (!playlistCatalog.renamePlaylist(oldName, newName)) {
      toast.error(i18n.global.t('toast.playlistNameExists'));
    }
  }

  function selectPlaylist(name: string): void {
    if (!playlistCatalog.selectPlaylist(name)) return;
    toast.info(i18n.global.t('toast.playlistLoaded', { name }));
  }

  return {
    playlistNameInput,
    selectPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
  };
}
