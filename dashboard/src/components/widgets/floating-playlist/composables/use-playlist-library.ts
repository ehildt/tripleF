import { watchDebounced } from '@vueuse/core';
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

const NAME_APPLY_DEBOUNCE_MS = 500;

/**
 * Saved-playlist behavior of the floating playlist, input-driven: naming
 * the queue saves it (type a name), further typing renames the saved
 * playlist, and emptying the field deletes it — the queue stays and
 * unnamed again. While a saved playlist is active it mirrors the
 * queue: queue edits sync into it automatically. Picking a saved playlist
 * in the menu loads it immediately (autoload — replace, not merge) and
 * marks it as the active one.
 */
export function usePlaylistLibrary(
  conversationId: Ref<string>,
  playlistVideos: Ref<VideoGalleryItem[]>,
) {
  const toast = useToast();

  /** Name of the queue's saved playlist ('' while the queue is unnamed). */
  const playlistNameInput = ref('');

  const savedPlaylistNames = computed(() =>
    savedPlaylists.value.map((entry) => entry.name),
  );

  const activeSavedPlaylist = computed(() =>
    savedPlaylists.value.find(
      (entry) => entry.id === activeSavedPlaylistId.value,
    ),
  );

  /** Apply the typed name: save, rename — or delete when emptied. */
  function applyNameInput(raw: string) {
    const name = raw.trim();

    // Emptied field: the saved playlist is deleted, the queue stays and
    // unnamed again.
    if (!name) {
      const active = activeSavedPlaylist.value;
      if (active) {
        deleteSavedPlaylist(active.id);
        toast.info(`Playlist "${active.name}" deleted`);
      }
      return;
    }

    // An input that already reflects the active playlist's name is settled
    // (rename attempts revert the input, which would otherwise loop).
    const active = activeSavedPlaylist.value;
    if (active) {
      if (active.name === name) return;
      const renamed = renameSavedPlaylist(active.id, name);
      if (!renamed) {
        toast.error('A playlist with that name already exists');
        playlistNameInput.value = active.name;
      }
      return;
    }

    // Temporary queue: the name becomes a new (or overwritten) playlist.
    const saved = savePlaylist(name, playlistVideos.value);
    if (!saved) {
      toast.error(
        playlistVideos.value.length > 0
          ? `Playlist could not be saved (limit of ${savedPlaylists.value.length} reached)`
          : 'Nothing to save — the playlist is empty',
      );
      return;
    }
    toast.info(`Playlist "${saved.name}" saved`);
  }

  // The name applies as the user types, debounced — no save button.
  watchDebounced(playlistNameInput, (value) => applyNameInput(value), {
    debounce: NAME_APPLY_DEBOUNCE_MS,
  });

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
    playlistNameInput.value = entry.name;
    toast.info(`Playlist "${entry.name}" loaded`);
  }

  return {
    playlistNameInput,
    savedPlaylistNames,
    selectPlaylist,
  };
}
