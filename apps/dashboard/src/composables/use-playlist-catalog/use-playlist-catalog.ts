import {
  deletePlaylist as deletePlaylistApi,
  fetchAllPlaylists,
  renamePlaylist as renamePlaylistApi,
  savePlaylist as savePlaylistApi,
} from '@/api/playlists.api';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { Playlist } from '@/stores/widgets/playlist/playlist.types';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import { mapPlaylistSnapshot } from './helpers/map-playlist-snapshot.helper';
import type { PlaylistCatalogControls } from './use-playlist-catalog.types';

const SESSION_ID = getPersistentSocketSessionId();

// Module-scope singleton: all playlist surfaces share one fetch and revision
// sequence. Tests must settle an in-flight load before resetting Pinia.
let playlistMutationCount = 0;
let playlistsFetchInFlight: Promise<void> | null = null;

/** Own server-backed playlist loading and optimistic persistence workflows. */
export function usePlaylistCatalog(): PlaylistCatalogControls {
  const playlistStore = usePlaylistStore();
  const toast = useToast();

  function markMutation(): void {
    playlistMutationCount += 1;
  }

  async function loadPlaylists(): Promise<void> {
    if (playlistsFetchInFlight) return playlistsFetchInFlight;
    const mutationAtStart = playlistMutationCount;
    const request = fetchAllPlaylists(SESSION_ID)
      .then((fetched) => {
        if (playlistMutationCount !== mutationAtStart) return;
        playlistStore.replacePlaylists(fetched.map(mapPlaylistSnapshot));
      })
      .catch((error: unknown) => {
        console.error('Playlist loading failed', error);
      })
      .finally(() => {
        if (playlistsFetchInFlight === request) {
          playlistsFetchInFlight = null;
        }
      });
    playlistsFetchInFlight = request;
    return request;
  }

  function persistPlaylist(playlist: Playlist): void {
    savePlaylistApi(SESSION_ID, playlist.name, playlist.videos).catch(() => {
      toast.error(
        i18n.global.t('toast.couldNotSavePlaylist', { name: playlist.name }),
      );
    });
  }

  function selectPlaylist(name: string): boolean {
    if (!playlistStore.selectPlaylist(name)) return false;
    // Selection is catalog state too: an older response may not restore a
    // different active playlist over a choice made while it was loading.
    markMutation();
    return true;
  }

  function createPlaylist(name: string): Playlist | null {
    const playlist = playlistStore.createPlaylist(name);
    if (!playlist) return null;
    markMutation();
    persistPlaylist(playlist);
    return playlist;
  }

  function renamePlaylist(oldName: string, newName: string): boolean {
    if (!playlistStore.renamePlaylist(oldName, newName)) return false;
    markMutation();
    renamePlaylistApi(SESSION_ID, oldName, newName.trim()).catch(() => {
      toast.error(
        i18n.global.t('toast.couldNotRenamePlaylist', { name: oldName }),
      );
    });
    return true;
  }

  function deletePlaylist(name: string): boolean {
    if (!playlistStore.deletePlaylist(name)) return false;
    markMutation();
    deletePlaylistApi(SESSION_ID, name).catch(() => {
      toast.error(i18n.global.t('toast.couldNotDeletePlaylist', { name }));
    });
    return true;
  }

  function addVideoToActivePlaylist(video: VideoGalleryItem): boolean {
    if (!playlistStore.addVideoToActivePlaylist(video)) return false;
    markMutation();
    const active = playlistStore.activePlaylist;
    if (active) persistPlaylist(active);
    return true;
  }

  function removeVideoFromActivePlaylist(videoUrl: string): boolean {
    if (!playlistStore.removeVideoFromActivePlaylist(videoUrl)) return false;
    markMutation();
    const active = playlistStore.activePlaylist;
    if (active) persistPlaylist(active);
    return true;
  }

  return {
    loadPlaylists,
    selectPlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addVideoToActivePlaylist,
    removeVideoFromActivePlaylist,
  };
}
