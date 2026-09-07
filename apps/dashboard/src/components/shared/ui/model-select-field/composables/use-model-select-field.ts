import { onMounted, onUnmounted, type Ref, ref } from 'vue';

import { useMenuPosition } from '@/composables/use-menu-position';

/**
 * Menu state for the ModelSelectField trigger + teleported dropdown, modeled
 * on the SpaceSelector: open state, fixed anchoring to the trigger (extending
 * leftward — the Memory tab sits in the right content area), and close on
 * outside mousedown. The model list owns its own search/filtering; this
 * composable only owns the dropdown mechanics.
 */
export function useModelSelectField(menuRefs: {
  containerRef: Ref<HTMLElement | null>;
  triggerRef: Ref<HTMLElement | null>;
  dropdownRef: Ref<HTMLElement | null>;
}) {
  const { containerRef, triggerRef, dropdownRef } = menuRefs;
  const isOpen = ref(false);

  const { positionStyle } = useMenuPosition(triggerRef, isOpen, {
    side: 'bottom',
  });

  function toggleMenu() {
    isOpen.value = !isOpen.value;
  }

  function closeMenu() {
    isOpen.value = false;
  }

  function onDocumentMousedown(event: MouseEvent) {
    const target = event.target as Node;
    const insideContainer = containerRef.value?.contains(target);
    const insideDropdown = dropdownRef.value?.contains(target);
    if (!insideContainer && !insideDropdown) closeMenu();
  }

  onMounted(() => document.addEventListener('mousedown', onDocumentMousedown));
  onUnmounted(() =>
    document.removeEventListener('mousedown', onDocumentMousedown),
  );

  return { isOpen, positionStyle, toggleMenu, closeMenu };
}
