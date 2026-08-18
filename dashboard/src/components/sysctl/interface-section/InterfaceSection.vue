<script setup lang="ts">
/**
 * The SysCtl "Interface" tab: interface visibility switches (sockets menu,
 * unread counters) and the prompt-bar icon menu behavior (always show vs
 * collapsible).
 */
import { Hash, ListFilter, PanelsTopLeft, Plug } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';

import { useSysctlMenuVisibility } from '../composables/use-sysctl-menu-visibility';
import { useSysctlTabVisibility } from '../composables/use-sysctl-tab-visibility';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SysCtlSectionHeader from '../shared/ui/sysctl-section-header/SysCtlSectionHeader.vue';

const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();

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
      <SysCtlSectionHeader
        :icon="Plug"
        :title="$t('common.interfaceSection')"
      />

      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Plug"
          :label="$t('common.sockets')"
          :description="$t('common.socketsDesc')"
          :checked="isTabVisible('sockets')"
          @toggle="toggleTab('sockets')"
        />
        <FieldCard
          :icon="Hash"
          :label="$t('common.counters')"
          :description="$t('common.countersDesc')"
          :checked="showCounters"
          @toggle="toggleShowCounters"
        />
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
  </SysCtlSection>
</template>

<style scoped>
.interface-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
