import type { PopoutAnchor } from '@/stores/popout-settings/popout-settings.types';

/**
 * Symmetric popout edge inset (rem) for anchored positions: a corner popout
 * sits the same distance from its two adjacent screen edges (e.g. top-left
 * is 3rem down AND 3rem in). Centered anchors use the same inset along the
 * offset axis.
 */
const EDGE_INSET_REM = 3;

const INSET = `${EDGE_INSET_REM}rem`;

/**
 * CSS anchoring per configured initial popout position, with equal distance
 * to the adjacent screen edges for symmetry. Centered anchors use translate
 * offsets; the transform drops away as soon as a remembered rect replaces
 * the anchor styles.
 */
export const POPUP_ANCHOR_STYLES: Record<
  PopoutAnchor,
  Record<string, string>
> = {
  'top-left': { left: INSET, top: INSET },
  'top-center': { left: '50%', top: INSET, transform: 'translateX(-50%)' },
  'top-right': { right: INSET, top: INSET },
  'middle-left': { left: INSET, top: '50%', transform: 'translateY(-50%)' },
  'middle-center': {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  'middle-right': { right: INSET, top: '50%', transform: 'translateY(-50%)' },
  'bottom-left': { left: INSET, bottom: INSET },
  'bottom-center': {
    left: '50%',
    bottom: INSET,
    transform: 'translateX(-50%)',
  },
  'bottom-right': { right: INSET, bottom: INSET },
};
