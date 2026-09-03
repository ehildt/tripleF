import { ref } from 'vue';

import type { SysctlTab } from './use-sysctl-tab.types';

const SYSCTL_TAB_STORAGE_KEY = 'vision-sysctl-tab';

const SYSCTL_TABS: readonly SysctlTab[] = [
  'integrations',
  'preprocessing',
  'layouts',
  'widgets',
  'chat',
  'interface',
  'memory',
  'system',
];

function loadSysctlTab(): SysctlTab {
  try {
    const saved = localStorage.getItem(SYSCTL_TAB_STORAGE_KEY);
    // Legacy: the widgets tab was called "popout" before it gained the toast
    // and tab-menu panels, and the integrations tab was "search-engines"
    // before it became a provider grid.
    if (saved === 'popout') return 'widgets';
    if (saved === 'search-engines') return 'integrations';
    return SYSCTL_TABS.includes(saved as SysctlTab)
      ? (saved as SysctlTab)
      : 'integrations';
  } catch {
    return 'integrations';
  }
}

/**
 * The active section tab of the SysCtl panel, persisted so the panel
 * reopens on the section the user last configured.
 */
export function useSysctlTab() {
  const activeSysctlTab = ref<SysctlTab>(loadSysctlTab());

  function selectSysctlTab(tab: SysctlTab) {
    activeSysctlTab.value = tab;
    try {
      localStorage.setItem(SYSCTL_TAB_STORAGE_KEY, tab);
    } catch {
      /* storage unavailable — the selection stays in-memory only */
    }
  }

  return { activeSysctlTab, selectSysctlTab };
}
