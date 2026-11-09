import type { ComputedRef } from 'vue';

export interface PlaylistTabState {
  /** Whether playlist or conversation video content makes the tab available. */
  hasPlaylist: ComputedRef<boolean>;
}
