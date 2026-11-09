import type { ComputedRef } from 'vue';

export interface PlaylistMarqueeState {
  /** Whether a playlist surface currently owns the now-playing marquee. */
  playlistMarqueeVisible: ComputedRef<boolean>;
}
