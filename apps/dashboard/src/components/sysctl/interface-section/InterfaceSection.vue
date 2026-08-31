<script setup lang="ts">
/**
 * The SysCtl "Interface" tab: chat chrome switches, grouped by where they
 * apply — the chat toolbar (sockets menu) and the menu strip above the chat
 * prompt input (source and view menus pinned open vs collapsed behind an
 * arrow). App tab menu visibility and counters live under Widgets → Tab menu.
 */
import { ListFilter, PanelsTopLeft, PanelTop, Plug } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';

import SectionHeader from '../../shared/ui/section-header/SectionHeader.vue';
import { useSysctlMenuVisibility } from '../composables/use-sysctl-menu-visibility';
import { useSysctlTabVisibility } from '../composables/use-sysctl-tab-visibility';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';

const { isTabVisible, toggleTab } = useSysctlTabVisibility();

const {
  sourceMenuAlwaysShow,
  viewMenuAlwaysShow,
  toggleSourceMenuAlwaysShow,
  toggleViewMenuAlwaysShow,
} = useSysctlMenuVisibility();
</script>

<template>
  <SysCtlSection>
    <div class="interface-section">
      <!-- Chat toolbar: the bar at the top of the chat view -->
      <div class="interface-section__group">
        <SectionHeader
          :icon="PanelTop"
          :title="$t('common.chatToolbarSection')"
        />
        <FieldGrid :items-per-row="2">
          <FieldCard
            :icon="Plug"
            :label="$t('common.sockets')"
            :description="$t('common.socketsDesc')"
            :checked="isTabVisible('sockets')"
            @toggle="toggleTab('sockets')"
          />
        </FieldGrid>
      </div>

      <!-- Chat prompt bar: the menu strip right above the prompt input -->
      <div class="interface-section__group">
        <SectionHeader
          :icon="ListFilter"
          :title="$t('common.chatPromptBarSection')"
        />
        <FieldGrid :items-per-row="2">
          <FieldCard
            :icon="ListFilter"
            :label="$t('common.sourceMenuAlwaysShow')"
            :description="$t('common.sourceMenuAlwaysShowDesc')"
            :checked="sourceMenuAlwaysShow"
            @toggle="toggleSourceMenuAlwaysShow"
          />
          <FieldCard
            :icon="PanelsTopLeft"
            :label="$t('common.viewMenuAlwaysShow')"
            :description="$t('common.viewMenuAlwaysShowDesc')"
            :checked="viewMenuAlwaysShow"
            @toggle="toggleViewMenuAlwaysShow"
          />
        </FieldGrid>
      </div>
    </div>
  </SysCtlSection>
</template>

<style scoped>
.interface-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.interface-section__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
