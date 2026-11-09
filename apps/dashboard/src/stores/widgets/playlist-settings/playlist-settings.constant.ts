import type { PlaylistAnchor, PlaylistMode } from './playlist-settings.types';

export const DEFAULT_PLAYLIST_MODE: PlaylistMode = 'panel';

export const DEFAULT_PLAYLIST_ANCHOR: PlaylistAnchor = 'top-right';

export const DEFAULT_PLAYLIST_AUTO_CLOSE = false;

export const PLAYLIST_MODE_STORAGE_KEY = 'vision-playlist-mode';

export const PLAYLIST_ANCHOR_STORAGE_KEY = 'vision-playlist-anchor';

export const PLAYLIST_AUTO_CLOSE_STORAGE_KEY = 'vision-playlist-auto-close';

export const PLAYLIST_ANCHORS: readonly PlaylistAnchor[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];
