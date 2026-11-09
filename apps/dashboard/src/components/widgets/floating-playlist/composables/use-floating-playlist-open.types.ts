import type { Ref } from 'vue';

export interface FloatingPlaylistOpenControls {
  /** Shared visibility read by the floating widget and app marquee. */
  floatingPlaylistOpen: Readonly<Ref<boolean>>;
  /** Open the floating window without changing playlist preferences. */
  openFloatingPlaylist: () => void;
  /** Toggle the floating window between open and collapsed. */
  toggleFloatingPlaylist: () => void;
  /** Collapse the floating window while retaining its playback state. */
  closeFloatingPlaylist: () => void;
}
