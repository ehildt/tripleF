export interface PlaylistTransportBarProps {
  playing: boolean;
  canTogglePlayback: boolean;
  playbackToggleTitle: string;
  hasActivePlayback: boolean;
  autoplayEnabled: boolean;
  popoutHidden: boolean;
  nowPlayingTitle?: string;
  /** Whether the bar carries the now-playing marquee (default true).
   *  Surfaces that place the marquee elsewhere turn it off here. */
  showNowPlaying?: boolean;
}
