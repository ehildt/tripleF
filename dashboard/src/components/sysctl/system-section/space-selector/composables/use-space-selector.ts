import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';

import { useMenuPosition } from '../../../../chat/toolbar/model-selector/composables/use-menu-position';

/**
 * Menu state for the SpaceSelector trigger + teleported dropdown, modeled on
 * the language menu: open/search state, fixed anchoring to the trigger
 * (extending leftward — the System tab sits in the right content area), and
 * close on outside mousedown. Selection/create/remove are emitted by the
 * component; this composable only owns the dropdown mechanics. The three
 * element refs are declared in the component (template-ref pattern) and
 * passed in here.
 */
export function useSpaceSelector(
  spaces: Ref<string[]>,
  menuRefs: {
    containerRef: Ref<HTMLElement | null>;
    triggerRef: Ref<HTMLElement | null>;
    dropdownRef: Ref<HTMLElement | null>;
  },
) {
  const { containerRef, triggerRef, dropdownRef } = menuRefs;
  const isOpen = ref(false);
  const searchQuery = ref('');

  const { positionStyle } = useMenuPosition(triggerRef, isOpen, {
    align: 'left',
  });

  const normalizedQuery = computed(() => searchQuery.value.trim());

  /** History entries matching the search query (all when empty). */
  const filteredSpaces = computed(() => {
    const query = normalizedQuery.value.toLowerCase();
    if (!query) return spaces.value;
    return spaces.value.filter((space) => space.toLowerCase().includes(query));
  });

  /** A query that no existing space matches exactly (case-insensitive) is
   *  creatable — selecting it is what creates the space. */
  const creatableSpace = computed(() => {
    const query = normalizedQuery.value;
    if (!query) return null;
    const exists = spaces.value.some(
      (space) => space.toLowerCase() === query.toLowerCase(),
    );
    return exists ? null : query;
  });

  function toggleMenu() {
    isOpen.value = !isOpen.value;
    if (isOpen.value) searchQuery.value = '';
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

  return {
    isOpen,
    searchQuery,
    positionStyle,
    filteredSpaces,
    creatableSpace,
    toggleMenu,
    closeMenu,
  };
}
