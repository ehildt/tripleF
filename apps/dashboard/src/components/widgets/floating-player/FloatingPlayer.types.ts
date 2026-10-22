import type { PlaybackSession } from '@/composables/create-playback-session/create-playback-session';

export interface FloatingPlayerProps {
  /** The app-level playback session — the player's single source of data. */
  session: PlaybackSession;
  /** Scroll the title when the playlist panel is not showing its marquee. */
  showTitleMarquee: boolean;
  /** Keep the media bar always visible (auto-hide when false). */
  popoutShowBarAlways: boolean;
}
