import { getCurrentScope, onScopeDispose } from 'vue';

import { usePlaylistCatalog } from '@/composables/use-playlist-catalog/use-playlist-catalog';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';

import { parsePlaylistFile } from '../helpers/parse-playlist-file.helper';
import { serializePlaylistFile } from '../helpers/serialize-playlist-file.helper';
import { toPlaylistFileName } from '../helpers/to-playlist-file-name.helper';
import {
  PLAYLIST_FILE_ACCEPT,
  PLAYLIST_FILE_MIME_TYPE,
} from '../playlist-file.constant';
import type { PlaylistFileTransferControls } from './use-playlist-file-transfer.types';

/** Own browser download and file-picker workflows for playlist JSON backups. */
export function usePlaylistFileTransfer(): PlaylistFileTransferControls {
  const playlistStore = usePlaylistStore();
  const playlistCatalog = usePlaylistCatalog();
  const toast = useToast();
  let playlistFileInput: HTMLInputElement | null = null;

  function discardPlaylistFileInput(): void {
    playlistFileInput?.remove();
    playlistFileInput = null;
  }

  if (getCurrentScope()) onScopeDispose(discardPlaylistFileInput);

  function savePlaylistToFile(name: string): void {
    const playlist = playlistStore.getPlaylist(name);
    if (!playlist) return;

    let objectUrl: string | null = null;
    let downloadLink: HTMLAnchorElement | null = null;
    try {
      const blob = new Blob([serializePlaylistFile(playlist.videos)], {
        type: PLAYLIST_FILE_MIME_TYPE,
      });
      objectUrl = URL.createObjectURL(blob);
      downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = toPlaylistFileName(playlist.name);
      downloadLink.hidden = true;
      document.body.append(downloadLink);
      downloadLink.click();
      toast.info(
        i18n.global.t('toast.playlistExported', { name: playlist.name }),
      );
    } catch (error: unknown) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(
        i18n.global.t('toast.couldNotExportPlaylist', {
          name: playlist.name,
        }),
      );
    } finally {
      downloadLink?.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  async function importPlaylistFile(file: File): Promise<void> {
    try {
      if (!/\.json$/i.test(file.name)) {
        throw new Error('Playlist import requires a .json file');
      }
      const name = file.name.slice(0, -'.json'.length).trim();
      if (!name) throw new Error('Playlist filename has no playlist name');

      const videos = parsePlaylistFile(await file.text());
      const playlist = playlistCatalog.importPlaylist(name, videos);
      if (!playlist) throw new Error('Playlist import was rejected');

      toast.info(
        i18n.global.t('toast.playlistImported', { name: playlist.name }),
      );
    } catch (error: unknown) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(
        i18n.global.t('toast.couldNotImportPlaylist', { name: file.name }),
      );
    }
  }

  function loadPlaylistFromFile(): void {
    discardPlaylistFileInput();
    const input = document.createElement('input');
    playlistFileInput = input;
    input.type = 'file';
    input.accept = PLAYLIST_FILE_ACCEPT;
    input.multiple = false;
    input.hidden = true;
    input.addEventListener('cancel', discardPlaylistFileInput, { once: true });
    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0];
        discardPlaylistFileInput();
        if (file) void importPlaylistFile(file);
      },
      { once: true },
    );
    document.body.append(input);
    input.click();
  }

  return { savePlaylistToFile, loadPlaylistFromFile };
}
