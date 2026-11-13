export interface PlaylistMenuItemProps {
  /** The saved playlist's name. */
  name: string;
  /** Whether this is the active playlist (tinted). */
  isActive: boolean;
}

export interface PlaylistMenuItemEmits {
  /** The read-only field was clicked — load this playlist. */
  select: [];
  /** Export this playlist entry as a JSON file. */
  save: [];
  /** The field was edited and blurred — rename to this value. */
  rename: [newName: string];
  /** Delete this playlist (Trash button or emptied field). */
  delete: [];
}
