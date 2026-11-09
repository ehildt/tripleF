import { DEFAULT_PLAYLIST_MODE } from '../playlist-settings.constant';
import type { PlaylistMode } from '../playlist-settings.types';

/** Parse a persisted docking mode without reading external state. */
export function parsePlaylistMode(saved: string | null): PlaylistMode {
  return saved === 'floating' ? 'floating' : DEFAULT_PLAYLIST_MODE;
}
