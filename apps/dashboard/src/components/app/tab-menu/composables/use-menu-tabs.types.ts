import type { MessageSquare } from '@lucide/vue';

import type { ActiveTab } from '@/stores/app/navigation/navigation.model';

export interface MenuTab {
  label: string;
  tab: ActiveTab;
  icon: typeof MessageSquare;
  tint: number;
  count?: number;
  showStar?: boolean;
  showDot?: boolean;
}
