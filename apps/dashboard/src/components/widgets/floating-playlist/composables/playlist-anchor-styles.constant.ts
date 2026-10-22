import type { PlaylistAnchor } from '@/stores/playlist/playlist.types';

/**
 * CSS anchoring per configured playlist position, mirroring the tab menu's
 * offsets: the window keeps a bit of distance to the screen edges (1vw /
 * 2vh) instead of docking flush against them. Centered anchors use
 * translate offsets.
 */
export const PLAYLIST_ANCHOR_STYLES: Record<
  PlaylistAnchor,
  Record<string, string>
> = {
  'top-left': { left: '1vw', top: '2vh' },
  'top-center': { left: '50%', top: '2vh', transform: 'translateX(-50%)' },
  'top-right': { right: '1vw', top: '2vh' },
  'middle-left': { left: '1vw', top: '50%', transform: 'translateY(-50%)' },
  'middle-center': {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  'middle-right': { right: '1vw', top: '50%', transform: 'translateY(-50%)' },
  'bottom-left': { left: '1vw', bottom: '2vh' },
  'bottom-center': {
    left: '50%',
    bottom: '2vh',
    transform: 'translateX(-50%)',
  },
  'bottom-right': { right: '1vw', bottom: '2vh' },
};

/** Gap between the tab menu's visible edge and a side-by-side playlist. */
export const TAB_MENU_GAP_PX = 8;
