import { computed, ref } from 'vue';

import { i18n } from '@/i18n/i18n';

import { SETTINGS_TAB_ITEMS } from '../settings-tab-items.constant';
import type { SettingsTab } from './use-settings-tab.types';

const SETTINGS_TAB_STORAGE_KEY = 'vision-settings-tab';

const SETTINGS_TABS: readonly SettingsTab[] = [
  'integrations',
  'preprocessing',
  'layouts',
  'widgets',
  'chat',
  'interface',
  'memory',
  'system',
];

function loadSettingsTab(): SettingsTab {
  try {
    const saved = localStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
    // Legacy: the widgets tab was called "popout" before it gained the toast
    // and tab-menu panels, and the integrations tab was "search-engines"
    // before it became a provider grid.
    if (saved === 'popout') return 'widgets';
    if (saved === 'search-engines') return 'integrations';
    return SETTINGS_TABS.includes(saved as SettingsTab)
      ? (saved as SettingsTab)
      : 'integrations';
  } catch {
    return 'integrations';
  }
}

/**
 * The active section tab of the Settings panel, persisted so the panel
 * reopens on the section the user last configured.
 */
export function useSettingsTab() {
  const activeSettingsTab = ref<SettingsTab>(loadSettingsTab());

  /** The active tab's localized label (the panel header's title). */
  const activeTabTitle = computed(() => {
    const item = SETTINGS_TAB_ITEMS.find(
      (entry) => entry.tab === activeSettingsTab.value,
    );
    return item ? i18n.global.t(item.labelKey) : '';
  });

  function selectSettingsTab(tab: SettingsTab) {
    activeSettingsTab.value = tab;
    try {
      localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, tab);
    } catch {
      /* storage unavailable — the selection stays in-memory only */
    }
  }

  return { activeSettingsTab, activeTabTitle, selectSettingsTab };
}
