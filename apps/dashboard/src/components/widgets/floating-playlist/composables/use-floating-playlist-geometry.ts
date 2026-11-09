import { computed } from 'vue';

import { useTabMenuRect } from '@/composables/use-tab-menu-rect/use-tab-menu-rect';
import { useTabMenuSettingsStore } from '@/stores/tab-menu-settings/tab-menu-settings.store';
import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';

import {
  PLAYLIST_ANCHOR_STYLES,
  TAB_MENU_GAP_PX,
} from './playlist-anchor-styles.constant';
import type { FloatingPlaylistGeometry } from './use-floating-playlist-geometry.types';

/**
 * Geometry of the floating playlist: the configured anchor, nothing else —
 * the window is not draggable. A same-side top anchor sits beside the tab
 * menu (left of it when the menu docks right, mirrored when it docks left)
 * instead of stacking below it, positioned from the menu's live rect —
 * reported as data by the tab menu itself (useTabMenuRect), because its
 * position changes when the side flips or the viewport resizes.
 */
export function useFloatingPlaylistGeometry(): FloatingPlaylistGeometry {
  const tabMenuSettingsStore = useTabMenuSettingsStore();
  const playlistSettingsStore = usePlaylistSettingsStore();
  const { tabMenuRect } = useTabMenuRect();

  /**
   * Whether the configured anchor shares the tab menu's top-side zone and
   * must sit beside the menu: top-row anchor on the menu's docked side.
   */
  const besideTabMenu = computed(
    () =>
      playlistSettingsStore.playlistAnchor.split('-')[0] === 'top' &&
      playlistSettingsStore.playlistAnchor.split('-')[1] ===
        tabMenuSettingsStore.tabMenuSide,
  );

  const playlistStyle = computed(() => {
    const style = {
      ...PLAYLIST_ANCHOR_STYLES[playlistSettingsStore.playlistAnchor],
    };
    if (besideTabMenu.value && tabMenuRect.value.width > 0) {
      if (tabMenuSettingsStore.tabMenuSide === 'right') {
        style.right = `${window.innerWidth - tabMenuRect.value.left + TAB_MENU_GAP_PX}px`;
        delete style.left;
      } else {
        style.left = `${tabMenuRect.value.left + tabMenuRect.value.width + TAB_MENU_GAP_PX}px`;
        delete style.right;
      }
    }
    return style;
  });

  return { playlistStyle };
}
