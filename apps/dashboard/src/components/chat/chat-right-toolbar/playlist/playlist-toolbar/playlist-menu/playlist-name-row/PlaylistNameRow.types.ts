export interface PlaylistNameRowProps {
  /** Whether creation is unavailable because the trimmed draft name is empty. */
  isCreateDisabled: boolean;
}

export interface PlaylistNameRowEmits {
  /** Import a playlist from one user-selected JSON file. */
  loadFile: [];
  /** Create a playlist from the drafted name. */
  create: [];
  /** Close the containing playlist menu. */
  close: [];
}
