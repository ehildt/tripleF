import {
  DEFAULT_PLAYLIST_ANCHOR,
  PLAYLIST_ANCHORS,
} from '../playlist-settings.constant';
import type { PlaylistAnchor } from '../playlist-settings.types';

/** Parse a persisted anchor without reading external state or casting input. */
export function parsePlaylistAnchor(saved: string | null): PlaylistAnchor {
  return (
    PLAYLIST_ANCHORS.find((anchor) => anchor === saved) ??
    DEFAULT_PLAYLIST_ANCHOR
  );
}
