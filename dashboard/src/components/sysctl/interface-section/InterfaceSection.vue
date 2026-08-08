<script setup lang="ts">
/**
 * The SysCtl "Interface" tab: interface visibility switches (sockets menu,
 * unread counters).
 */
import { Hash, Plug } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';

import { useSysctlTabVisibility } from '../composables/use-sysctl-tab-visibility';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SysCtlSectionHeader from '../shared/ui/sysctl-section-header/SysCtlSectionHeader.vue';

const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();
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
