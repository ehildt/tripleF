import { onScopeDispose, type Ref, ref, watch } from 'vue';

export type MenuPositionStyle = { left: string; top: string };

/**
 * Fixed-position style that anchors the teleported model menu to its trigger.
 * Tracks the trigger's bounding rect only while the menu is open: scroll and
 * resize listeners are attached on open and removed on close or unmount.
 * scroll is captured because it does not bubble from inner containers.
 */
export function useMenuPosition(
  triggerRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
) {
  const positionStyle = ref<MenuPositionStyle | null>(null);

  function updatePosition() {
    const rect = triggerRef.value?.getBoundingClientRect();
    positionStyle.value = rect
      ? { left: `${rect.right}px`, top: `${rect.top}px` }
      : null;
  }

  function startTracking() {
    updatePosition();
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, {
      passive: true,
      capture: true,
    });
  }

  function stopTracking() {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, { capture: true });
  }

  watch(isOpen, (open) => {
    if (open) startTracking();
    else stopTracking();
  });

  onScopeDispose(stopTracking);

  return { positionStyle };
}
