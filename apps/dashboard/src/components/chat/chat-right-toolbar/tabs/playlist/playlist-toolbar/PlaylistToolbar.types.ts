export interface PlaylistToolbarProps {
  /** Whether the active playback is currently playing. */
  playing: boolean;
  /** Whether the play/pause control is enabled. */
  canTogglePlayback: boolean;
  /** Tooltip/label for the play/pause control. */
  playbackToggleTitle: string;
  /** Whether there is an active playback that can be stopped. */
  hasActivePlayback: boolean;
  /** Whether autoplay is enabled. */
  autoplayEnabled: boolean;
  /** Whether the popout is hidden while playlist videos play. */
  popoutHidden: boolean;
  /** Title of the active playback (passed to the transport bar). */
  nowPlayingTitle: string;
  /** Name of the active playlist. */
  activePlaylistName: string;
  /** Name being typed for a new playlist. */
  playlistName: string;
  /** Names of the saved playlists. */
  playlists: readonly string[];
}
