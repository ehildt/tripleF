import type { ComputedRef } from 'vue';

export interface PlaylistPanelState {
  /** Whether the active playlist contains at least one queued video. */
  hasQueuedVideos: ComputedRef<boolean>;
}
