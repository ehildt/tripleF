export interface PlaylistMenuProps {
  /** Names of the saved playlists, listed below the name field. */
  playlists: readonly string[];
  /** Name of the active playlist, tinted in the list. */
  activePlaylistName: string;
}

export interface PlaylistMenuEmits {
  /** A saved playlist was picked and becomes active immediately. */
  select: [name: string];
  /** Load a playlist from one user-selected JSON file. */
  loadFile: [];
  /** Save the named playlist entry to a JSON file. */
  saveFile: [name: string];
  /** Save the typed name as a playlist (Plus button or Enter). */
  create: [];
  /** Rename the named saved playlist. */
  rename: [oldName: string, newName: string];
  /** Delete the named saved playlist (its Trash button). */
  delete: [name: string];
}
