import { computed, type Ref, ref, watch } from 'vue';

import { replacePlaylistVideos } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { useToast } from '@/composables/use-toast';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  activeSavedPlaylistId,
  deleteSavedPlaylist,
  renameSavedPlaylist,
  savedPlaylists,
  savePlaylist,
  setActiveSavedPlaylist,
  syncActiveSavedPlaylist,
} from './saved-playlists.state';

/**
 * Saved-playlist behavior of the floating playlist, action-driven: the
 * name input's Plus button (or Enter) saves the queue under the typed name
 * and clears the field for the next one; each saved playlist in the list
 * carries its own Trash button to delete it. Picking a saved playlist in
 * the menu loads it immediately (autoload — replace, not merge) and marks
 * it as the active one. While a saved playlist is active it mirrors the
 * queue: queue edits sync into it automatically.
 */
export function usePlaylistLibrary(
  conversationId: Ref<string>,
  playlistVideos: Ref<VideoGalleryItem[]>,
) {
  const toast = useToast();

  /** Name being typed for a new playlist ('' once saved — the field clears). */
  const playlistNameInput = ref('');

  const savedPlaylistNames = computed(() =>
    savedPlaylists.value.map((entry) => entry.name),
  );

  const activeSavedPlaylist = computed(() =>
    savedPlaylists.value.find(
      (entry) => entry.id === activeSavedPlaylistId.value,
    ),
  );

  /** Name of the active playlist, for tinting it in the list. */
  const activePlaylistName = computed(
    () => activeSavedPlaylist.value?.name ?? '',
  );

  /** Save the typed name as a new (or overwritten) playlist, then clear the field. */
  function createPlaylist() {
    const name = playlistNameInput.value.trim();
    if (!name) return;
    const saved = savePlaylist(name, playlistVideos.value);
    if (!saved) {
      toast.error(
        `Playlist could not be saved (limit of ${savedPlaylists.value.length} reached)`,
      );
      return;
    }
    toast.info(`Playlist "${saved.name}" saved`);
    // The field is cleared so the user can name the next playlist.
    playlistNameInput.value = '';
  }

  /** Delete a saved playlist by name. */
  function deletePlaylist(name: string) {
    const entry = savedPlaylists.value.find(
      (playlist) => playlist.name === name,
    );
    if (!entry) return;
    deleteSavedPlaylist(entry.id);
    toast.info(`Playlist "${entry.name}" deleted`);
    if (activeSavedPlaylistId.value === entry.id) {
      playlistNameInput.value = '';
    }
  }

  /** Rename a saved playlist, showing an error on a taken name. */
  function renamePlaylist(oldName: string, newName: string) {
    const entry = savedPlaylists.value.find(
      (playlist) => playlist.name === oldName,
    );
    if (!entry) return;
    const renamed = renameSavedPlaylist(entry.id, newName);
    if (!renamed) {
      toast.error('A playlist with that name already exists');
    }
  }

  // A named queue mirrors its edits into the saved playlist.
  watch(playlistVideos, (videos) => syncActiveSavedPlaylist(videos));

  // Queues are conversation-scoped — a switch starts from an unnamed queue.
  watch(conversationId, () => {
    setActiveSavedPlaylist(null);
    playlistNameInput.value = '';
  });

  /** Load a saved playlist by name, replacing the queue. */
  function selectPlaylist(name: string) {
    const entry = savedPlaylists.value.find(
      (playlist) => playlist.name === name,
    );
    if (!entry) return;
    replacePlaylistVideos(conversationId.value, entry.videos);
    setActiveSavedPlaylist(entry.id);
    toast.info(`Playlist "${entry.name}" loaded`);
  }

  return {
    playlistNameInput,
    savedPlaylistNames,
    activePlaylistName,
    selectPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
  };
}
