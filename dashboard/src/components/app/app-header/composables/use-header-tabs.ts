import { computed } from 'vue';

import type { ActiveTab } from '../../../../stores/app';
import { useAppStore } from '../../../../stores/app';

const TAB_TINTS: Record<ActiveTab, number> = {
  http: 0.15,
  dlq: 0.55,
  debug: 0.75,
  sysctl: 1,
};

export interface HeaderTab {
  label: string;
  tab: ActiveTab;
  tint: number;
  count?: number;
  showStar?: boolean;
}

export function useHeaderTabs(props: {
  activeTab: ActiveTab;
  debugCount: number;
  dlqCount?: number;
  showChatStar?: boolean;
}) {
  const appStore = useAppStore();

  const tabs = computed<HeaderTab[]>(() => {
    const showCounters = appStore.showCounters;

    const allTabs: HeaderTab[] = [
      {
        label: '> CHAT_',
        tab: 'http',
        tint: TAB_TINTS.http,
        showStar: props.showChatStar,
      },
      {
        label: '> DLQ_',
        tab: 'dlq',
        tint: TAB_TINTS.dlq,
        count: showCounters ? (props.dlqCount ?? 0) : undefined,
      },
      {
        label: '> DEBUG_',
        tab: 'debug',
        tint: TAB_TINTS.debug,
        count: showCounters ? (props.debugCount ?? 0) : undefined,
      },
      {
        label: '> SYSCTL_',
        tab: 'sysctl',
        tint: TAB_TINTS.sysctl,
      },
    ];

    return allTabs.filter((tab) => appStore.isTabVisible(tab.tab));
  });

  const activeTabTint = computed(
    () => TAB_TINTS[props.activeTab] ?? TAB_TINTS.sysctl,
  );

  return { tabs, activeTabTint };
}
