import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

import type { ActiveTab } from '../../../../../stores/app';
import type { HeaderTab } from '../../composables/use-header-tabs';

/**
 * State for the header burger navigation: dropdown open/close with
 * Escape + outside-click dismissal, and the aggregated notification dot
 * shown on the burger whenever any non-active tab has a pending
 * indicator (count or star).
 */
export function useNavMenu(
  props: { tabs: readonly HeaderTab[]; activeTab: ActiveTab },
  emit: { tabChange: [tab: ActiveTab] },
) {
  const isOpen = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  /** Accumulated pending count across all non-active tabs. */
  const pendingCount = computed(() =>
    props.tabs
      .filter((tab) => tab.tab !== props.activeTab)
      .reduce((sum, tab) => sum + (tab.count ?? 0), 0),
  );

  /** Star fallback when there is no count to show. */
  const hasPendingStar = computed(
    () =>
      pendingCount.value === 0 &&
      props.tabs.some((tab) => tab.tab !== props.activeTab && tab.showStar),
  );

  function toggleMenu() {
    isOpen.value = !isOpen.value;
  }

  function closeMenu() {
    isOpen.value = false;
  }

  function selectTab(tab: ActiveTab) {
    emit('tabChange', tab);
    closeMenu();
  }

  onClickOutside(containerRef, closeMenu);
  onKeyStroke('Escape', closeMenu);

  return {
    containerRef,
    isOpen,
    pendingCount,
    hasPendingStar,
    toggleMenu,
    closeMenu,
    selectTab,
  };
}
