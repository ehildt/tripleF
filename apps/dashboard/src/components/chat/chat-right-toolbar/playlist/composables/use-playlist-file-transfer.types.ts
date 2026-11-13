export interface PlaylistFileTransferControls {
  /** Download the named playlist entry as a lossless JSON file. */
  savePlaylistToFile: (name: string) => void;
  /** Open a single-file picker and import the selected playlist JSON file. */
  loadPlaylistFromFile: () => void;
}
