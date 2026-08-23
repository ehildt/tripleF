import { Bug, MailX, MessageSquare, SlidersHorizontal } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '../../../../stores/app';
import type { ActiveTab } from '../../../../types/app.model';
import type { MenuTab } from './use-menu-tabs.types';

const TAB_TINTS: Record<ActiveTab, number> = {
  chat: 0.15,
  dlq: 0.55,
  debug: 0.75,
  sysctl: 1,
};

const TAB_ICONS: Record<ActiveTab, MenuTab['icon']> = {
  chat: MessageSquare,
  dlq: MailX,
  debug: Bug,
  sysctl: SlidersHorizontal,
};

export function useMenuTabs(props: {
  activeTab: ActiveTab;
  debugCount: number;
  dlqCount?: number;
  showChatStar?: boolean;
}) {
  const appStore = useAppStore();
  const { t } = useI18n();

  const tabs = computed<MenuTab[]>(() => {
    const showCounters = appStore.showCounters;

    const allTabs: MenuTab[] = [
      {
        label: t('nav.chat'),
        tab: 'chat',
        icon: TAB_ICONS.chat,
        tint: TAB_TINTS.chat,
        showStar: props.showChatStar,
      },
      {
        label: t('nav.dlq'),
        tab: 'dlq',
        icon: TAB_ICONS.dlq,
        tint: TAB_TINTS.dlq,
        count: showCounters ? (props.dlqCount ?? 0) : undefined,
      },
      {
        label: t('nav.debug'),
        tab: 'debug',
        icon: TAB_ICONS.debug,
        tint: TAB_TINTS.debug,
        count: showCounters ? (props.debugCount ?? 0) : undefined,
      },
      {
        label: t('nav.sysctl'),
        tab: 'sysctl',
        icon: TAB_ICONS.sysctl,
        tint: TAB_TINTS.sysctl,
      },
    ];

    return allTabs.filter((tab) => appStore.isTabVisible(tab.tab));
  });

  return { tabs };
}
