import { ref } from 'vue';

/** Section tabs inside the SysCtl panel. */
export type SysctlTab =
  'search-engines' | 'preprocessing' | 'widgets' | 'interface' | 'system';

const SYSCTL_TAB_STORAGE_KEY = 'vision-sysctl-tab';

const SYSCTL_TABS: readonly SysctlTab[] = [
  'search-engines',
  'preprocessing',
  'widgets',
  'interface',
  'system',
];

function loadSysctlTab(): SysctlTab {
  try {
    const saved = localStorage.getItem(SYSCTL_TAB_STORAGE_KEY);
    // Legacy: the widgets tab was called "popout" before it gained the toast panel.
    if (saved === 'popout') return 'widgets';
    return SYSCTL_TABS.includes(saved as SysctlTab)
      ? (saved as SysctlTab)
      : 'search-engines';
  } catch {
    return 'search-engines';
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
