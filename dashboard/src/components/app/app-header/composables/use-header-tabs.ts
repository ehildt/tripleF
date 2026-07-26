import { Bug, MailX, MessageSquare, SlidersHorizontal } from '@lucide/vue';
import { computed } from 'vue';

import type { ActiveTab } from '../../../../stores/app';
import { useAppStore } from '../../../../stores/app';

const TAB_TINTS: Record<ActiveTab, number> = {
  http: 0.15,
  dlq: 0.55,
  debug: 0.75,
  sysctl: 1,
};

const TAB_ICONS: Record<ActiveTab, HeaderTab['icon']> = {
  http: MessageSquare,
  dlq: MailX,
  debug: Bug,
  sysctl: SlidersHorizontal,
};

export interface HeaderTab {
  label: string;
  tab: ActiveTab;
  icon: typeof MessageSquare;
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
        label: 'chat',
        tab: 'http',
        icon: TAB_ICONS.http,
        tint: TAB_TINTS.http,
        showStar: props.showChatStar,
      },
      {
        label: 'dlq',
        tab: 'dlq',
        icon: TAB_ICONS.dlq,
        tint: TAB_TINTS.dlq,
        count: showCounters ? (props.dlqCount ?? 0) : undefined,
      },
      {
        label: 'debug',
        tab: 'debug',
        icon: TAB_ICONS.debug,
        tint: TAB_TINTS.debug,
        count: showCounters ? (props.debugCount ?? 0) : undefined,
      },
      {
        label: 'sysctl',
        tab: 'sysctl',
        icon: TAB_ICONS.sysctl,
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
