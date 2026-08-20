<script setup lang="ts">
/**
 * The section tab bar of the SysCtl panel: one icon per settings group
 * (search engines, preprocessing, layouts, widgets, chat navigation,
 * interface, system).
 */
import {
  Blocks,
  Cog,
  Layers,
  LayoutTemplate,
  MessagesSquare,
  Radar,
  ScanEye,
} from '@lucide/vue';
import { computed } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import { i18n } from '@/i18n/i18n';

import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import type { SysctlTab } from '../composables/use-sysctl-tab.types';

defineProps<{
  activeTab: SysctlTab;
}>();

const emit = defineEmits<{
  selectTab: [tab: SysctlTab];
}>();

const TAB_LABELS = computed<
  { tab: SysctlTab; label: string; icon: typeof Cog }[]
>(() => [
  {
    tab: 'search-engines',
    label: i18n.global.t('common.sysctlSearchEngines'),
    icon: Radar,
  },
  {
    tab: 'preprocessing',
    label: i18n.global.t('common.sysctlPreprocessing'),
    icon: ScanEye,
  },
  {
    tab: 'layouts',
    label: i18n.global.t('common.sysctlLayouts'),
    icon: Layers,
  },
  {
    tab: 'widgets',
    label: i18n.global.t('common.sysctlWidgets'),
    icon: Blocks,
  },
  {
    tab: 'chat',
    label: i18n.global.t('common.sysctlChatNavigation'),
    icon: MessagesSquare,
  },
  {
    tab: 'interface',
    label: i18n.global.t('common.sysctlInterface'),
    icon: LayoutTemplate,
  },
  { tab: 'system', label: i18n.global.t('common.sysctlSystem'), icon: Cog },
]);
</script>

<template>
  <div class="sysctl-menu" role="tablist">
    <Tooltip
      v-for="{ tab, label, icon } in TAB_LABELS"
      :key="tab"
      :text="label"
    >
      <button
        type="button"
        role="tab"
        :aria-label="label"
        :aria-selected="activeTab === tab"
        class="sysctl-menu__tab"
        :class="{ 'sysctl-menu__tab--active': activeTab === tab }"
        @click="emit('selectTab', tab)"
      >
        <MotionIcon>
          <component :is="icon" class="sysctl-menu__tab-icon" />
        </MotionIcon>
      </button>
    </Tooltip>
  </div>
</template>

<style scoped>
.sysctl-menu {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.sysctl-menu__tab {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  color: var(--color-fg-muted);
  background-color: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  border-radius: var(--spacing-1);
}

.sysctl-menu__tab:hover {
  color: var(--color-fg-primary);
}

.sysctl-menu__tab--active,
.sysctl-menu__tab--active:hover {
  color: var(--color-accent-primary);
}

.sysctl-menu__tab:focus {
  outline: none;
}

.sysctl-menu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.sysctl-menu__tab-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
