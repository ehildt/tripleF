import { computed, onMounted, onUnmounted, ref } from 'vue';

import { tabMenuSide } from '@/components/app/tab-menu/composables/tab-menu-settings.state';

import { type PlaylistAnchor, playlistAnchor } from './playlist-settings.state';

/**
 * CSS anchoring per configured position, with the tab menu's offsets: the
 * window keeps a bit of distance to the screen edges (1vw / 2vh) instead of
 * docking flush against them. Centered anchors use translate offsets.
 */
const PLAYLIST_ANCHOR_STYLES: Record<PlaylistAnchor, Record<string, string>> = {
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
const TAB_MENU_GAP_PX = 8;

/**
 * Geometry of the floating playlist: the configured anchor, nothing else —
 * the window is not draggable. A same-side top anchor sits beside the tab
 * menu (left of it when the menu docks right, mirrored when it docks left)
 * instead of stacking below it, tracking the menu via observers because its
 * position changes when the side flips or the viewport resizes.
 */
export function useFloatingPlaylistGeometry() {
  /** Left edge (px from viewport left) of the tab menu; 0 = not found. */
  const tabMenuLeft = ref(0);
  /** Width (px) of the tab menu; 0 = not found. */
  const tabMenuWidth = ref(0);

  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  onMounted(() => {
    const menu = document.querySelector<HTMLElement>('.tab-menu');
    if (!menu) return;

    const measure = () => {
      const rect = menu.getBoundingClientRect();
      tabMenuLeft.value = rect.left;
      tabMenuWidth.value = rect.width;
    };
    measure();

    // Drawer open/close flips a class on the menu without resizing it — the
    // mutation observer catches that, the resize observer the rest.
    resizeObserver = new ResizeObserver(measure);
    mutationObserver = new MutationObserver(measure);
    resizeObserver.observe(menu);
    mutationObserver.observe(menu, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style'],
    });
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
  });

  /**
   * Whether the configured anchor shares the tab menu's top-side zone and
   * must sit beside the menu: top-row anchor on the menu's docked side.
   */
  const besideTabMenu = computed(
    () =>
      playlistAnchor.value.split('-')[0] === 'top' &&
      playlistAnchor.value.split('-')[1] === tabMenuSide.value,
  );

  const playlistStyle = computed(() => {
    const style = { ...PLAYLIST_ANCHOR_STYLES[playlistAnchor.value] };
    if (besideTabMenu.value && tabMenuWidth.value > 0) {
      if (tabMenuSide.value === 'right') {
        style.right = `${window.innerWidth - tabMenuLeft.value + TAB_MENU_GAP_PX}px`;
        delete style.left;
      } else {
        style.left = `${tabMenuLeft.value + tabMenuWidth.value + TAB_MENU_GAP_PX}px`;
        delete style.right;
      }
    }
    return style;
  });

  return { playlistStyle };
}
