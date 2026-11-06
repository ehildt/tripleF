<script setup lang="ts">
import { Network } from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemoryConstellationDiagramConfigProps } from './MemoryConstellationDiagramConfig.types';

defineProps<MemoryConstellationDiagramConfigProps>();
</script>

<template>
  <div class="memory-constellation-diagram-config">
    <SectionHeader :icon="Network" :title="$t('common.memoryDiagramSection')" />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="Network"
        :label="$t('common.memoryConstellationNodeLimit')"
        :description="$t('common.memoryConstellationNodeLimitDesc')"
        :number-value="constellationNodeLimit"
        :number-step="100"
        :number-min="100"
        :number-max="10000"
        :show-checkbox="false"
        @update:number-value="onSaveConstellationNodeLimit"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-constellation-diagram-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
