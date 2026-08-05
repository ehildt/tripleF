import { computed, type Ref, ref, watch } from 'vue';

import { useToast } from '@/composables/use-toast';

import {
  activePlaylistName,
  createPlaylist as createPlaylistState,
  deletePlaylist as deletePlaylistState,
  getPlaylists,
  loadPlaylists,
  renamePlaylist as renamePlaylistState,
  selectPlaylist as selectPlaylistState,
} from './playlist.state';

/**
 * Playlist behavior of the playlist panel, action-driven and database-backed:
 * the name input's Plus button (or Enter) creates a new empty playlist and
 * makes it active; each playlist in the menu carries its own Trash button to
 * delete it. Picking a playlist in the menu makes it active, which loads its
 * videos into the queue. Playlists are global across the session — the panel
 * shows every playlist; the conversation id is only used when creating a new
 * playlist (it is part of the DB compound key).
 */
export function usePlaylistLibrary(conversationId: Ref<string>) {
  const toast = useToast();

  /** Name being typed for a new playlist ('' once created — the field clears). */
  const playlistNameInput = ref('');

  const playlistNames = computed(() =>
    getPlaylists().map((playlist) => playlist.name),
  );

  const activePlaylistNameValue = computed(() => activePlaylistName.value);

  // Load all playlists for the session from the database, restoring the
  // active playlist (defaulting to the first one).
  watch(
    conversationId,
    () => {
      void loadPlaylists();
    },
    { immediate: true },
  );

  /** Create a new empty playlist from the typed name, then clear the field. */
  function createPlaylist() {
    const name = playlistNameInput.value.trim();
    if (!name) return;
    createPlaylistState(conversationId.value, name);
    toast.info(`Playlist "${name}" created`);
    playlistNameInput.value = '';
  }

  /** Delete a playlist by name. */
  function deletePlaylist(name: string) {
    deletePlaylistState(name);
    toast.info(`Playlist "${name}" deleted`);
    if (activePlaylistNameValue.value === name) {
      playlistNameInput.value = '';
    }
  }

  /** Rename a playlist, showing an error on a taken name. */
  function renamePlaylist(oldName: string, newName: string) {
    const renamed = renamePlaylistState(oldName, newName);
    if (!renamed) {
      toast.error('A playlist with that name already exists');
    }
  }

  /** Make a playlist active, loading its videos into the queue. */
  function selectPlaylist(name: string) {
    selectPlaylistState(name);
    toast.info(`Playlist "${name}" loaded`);
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
