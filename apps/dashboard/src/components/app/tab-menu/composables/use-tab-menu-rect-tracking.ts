import type { Ref } from 'vue';
import { onMounted, onUnmounted } from 'vue';

import { useTabMenuRect } from '@/composables/use-tab-menu-rect/use-tab-menu-rect';

/**
 * Publishes the tab menu's live viewport rect through useTabMenuRect (the
 * playlist window positions itself beside the menu from it). The tracking
 * observes the menu *element this group owns*: a resize observer covers
 * width and viewport changes, a mutation observer the drawer toggles that
 * flip a class without resizing. On unmount the rect resets to zero — no
 * stale geometry for consumers mounted later.
 */
export function useTabMenuRectTracking(menuRef: Ref<HTMLElement | null>) {
  const { reportTabMenuRect } = useTabMenuRect();

  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  onMounted(() => {
    const menu = menuRef.value;
    if (!menu) return;

    const measure = () => {
      const rect = menu.getBoundingClientRect();
      reportTabMenuRect({ left: rect.left, width: rect.width });
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
    reportTabMenuRect({ left: 0, width: 0 });
  });
}
