import type { PopoutAnchor } from './popout-settings.types';

export const DEFAULT_POPOUT_ANCHOR: PopoutAnchor = 'bottom-right';

export const DEFAULT_POPOUT_REMEMBER_POSITION = true;

export const DEFAULT_POPOUT_ENABLED = true;

export const DEFAULT_POPOUT_HIDE_ON_PLAYLIST = false;

export const DEFAULT_POPOUT_AUTO_DOCK = true;

export const DEFAULT_POPOUT_SHOW_BAR_ALWAYS = true;

export const POPOUT_ENABLED_STORAGE_KEY = 'vision-popout-enabled';

export const POPOUT_ANCHOR_STORAGE_KEY = 'vision-popout-anchor';

export const POPOUT_REMEMBER_POSITION_STORAGE_KEY =
  'vision-popout-remember-position';

export const POPOUT_RECT_STORAGE_KEY = 'vision-popout-rect';

export const POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY =
  'vision-popout-hide-on-playlist';

export const POPOUT_AUTO_DOCK_STORAGE_KEY = 'vision-popout-auto-dock';

export const POPOUT_SHOW_BAR_ALWAYS_STORAGE_KEY =
  'vision-popout-show-bar-always';

export const POPOUT_ANCHORS: readonly PopoutAnchor[] = [
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
