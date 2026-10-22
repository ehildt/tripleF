import {
  createPlaybackSession,
  type PlaybackSession,
} from '../create-playback-session/create-playback-session';

let session: PlaybackSession | null = null;

/**
 * Read the app-level playback session singleton. Created lazily on first use
 * and shared by import across the tree — the floating player receives it as a
 * prop, and chat surfaces read the same instance through this composable.
 */
export function usePlaybackSession(): PlaybackSession {
  session ??= createPlaybackSession();
  return session;
}
