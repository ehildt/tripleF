import { computed, ref } from 'vue';

import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/playlist';

/**
 * Playlist behavior of the playlist panel, action-driven and database-backed:
 * the name input's Plus button (or Enter) creates a new empty playlist and
 * makes it active; each playlist in the menu carries its own Trash button to
 * delete it. Picking a playlist in the menu makes it active, which loads its
 * videos into the queue. Playlists are global across the session — the panel
 * shows every playlist.
 */
export function usePlaylistLibrary() {
  const toast = useToast();
  const playlistStore = usePlaylistStore();

  /** Name being typed for a new playlist ('' once created — the field clears). */
  const playlistNameInput = ref('');

  const playlistNames = computed(() =>
    playlistStore.getPlaylists().map((playlist) => playlist.name),
  );

  const activePlaylistNameValue = computed(
    () => playlistStore.activePlaylistName,
  );

  /** Create a new empty playlist from the typed name, then clear the field. */
  function createPlaylist() {
    const name = playlistNameInput.value.trim();
    if (!name) return;
    playlistStore.createPlaylist(name);
    toast.info(i18n.global.t('toast.playlistCreated', { name }));
    playlistNameInput.value = '';
  }

  /** Delete a playlist by name. */
  function deletePlaylist(name: string) {
    playlistStore.deletePlaylist(name);
    toast.info(i18n.global.t('toast.playlistDeleted', { name }));
    if (activePlaylistNameValue.value === name) {
      playlistNameInput.value = '';
    }
  }

  /** Rename a playlist, showing an error on a taken name. */
  function renamePlaylist(oldName: string, newName: string) {
    const renamed = playlistStore.renamePlaylist(oldName, newName);
    if (!renamed) {
      toast.error(i18n.global.t('toast.playlistNameExists'));
    }
  }

  /** Make a playlist active, loading its videos into the queue. */
  function selectPlaylist(name: string) {
    playlistStore.selectPlaylist(name);
    toast.info(i18n.global.t('toast.playlistLoaded', { name }));
  }

  return {
    playlistNameInput,
    playlistNames,
    activePlaylistName: activePlaylistNameValue,
    selectPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
  };
}
