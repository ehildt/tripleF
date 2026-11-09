import type { Ref } from 'vue';

export interface PlaylistLibraryControls {
  /** Draft name for creating a playlist. */
  playlistNameInput: Ref<string>;
  /** Select a playlist and announce a successful selection. */
  selectPlaylist: (name: string) => void;
  /** Create the drafted playlist and clear the draft after success. */
  createPlaylist: () => void;
  /** Delete an existing playlist and announce the deletion. */
  deletePlaylist: (name: string) => void;
  /** Rename a playlist or announce an invalid/taken name. */
  renamePlaylist: (oldName: string, newName: string) => void;
}
