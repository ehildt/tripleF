import { tryOnScopeDispose } from '@vueuse/core';
import { nextTick, onMounted, type Ref, ref, watch } from 'vue';

export type MenuPositionStyle = { left: string; top: string };

/**
 * Fixed-position style that anchors the teleported menu to its trigger.
 * Tracks the trigger's bounding rect only while the menu is open: scroll,
 * resize, and layout shifts (toolbar reflow when content above changes)
 * re-anchor the menu; listeners and observers detach on close or unmount.
 * scroll is captured because it does not bubble from inner containers.
 *
 * The menu opens at the trigger's right edge (model menu, new-conversation
 * menu). Expandable toolbar lists stay inline in the toolbar flow instead,
 * so they push sibling groups down rather than floating over them.
 */
export function useMenuPosition(
  triggerRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
) {
  const positionStyle = ref<MenuPositionStyle | null>(null);

  function updatePosition() {
    const rect = triggerRef.value?.getBoundingClientRect();
    if (!rect) {
      positionStyle.value = null;
      return;
    }
    positionStyle.value = { left: `${rect.right}px`, top: `${rect.top}px` };
  }

  // ResizeObserver on the trigger catches size changes; observing the body
  // catches layout reflows that move the trigger without scrolling (e.g. a
  // new conversation growing the toolbar above an open menu).
  let resizeObserver: ResizeObserver | null = null;

  function stopTracking() {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, { capture: true });
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  function startTracking() {
    // Idempotent: re-attaching must never double-register listeners.
    stopTracking();
    updatePosition();
    // Re-anchor after the render: at mount time (menu persisted open) the
    // trigger rect only exists once the DOM is up.
    void nextTick(updatePosition);
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, {
      passive: true,
      capture: true,
    });
    resizeObserver = new ResizeObserver(updatePosition);
    if (triggerRef.value) resizeObserver.observe(triggerRef.value);
    if (document.body) resizeObserver.observe(document.body);
  }

  // The watcher alone misses the mount-expanded case (persisted expansion
  // state applies on mount, no change ever fires) — the floating menu would
  // get fixed positioning without coordinates.
  onMounted(() => {
    if (isOpen.value) startTracking();
  });

  watch(isOpen, (open) => {
    if (open) startTracking();
    else stopTracking();
  });

  tryOnScopeDispose(stopTracking);

  return { positionStyle };
}
