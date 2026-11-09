import type { ComputedRef } from 'vue';

export interface FloatingPlaylistGeometry {
  /** Fixed-position CSS offsets adjusted around the docked tab menu. */
  playlistStyle: ComputedRef<Record<string, string>>;
}
