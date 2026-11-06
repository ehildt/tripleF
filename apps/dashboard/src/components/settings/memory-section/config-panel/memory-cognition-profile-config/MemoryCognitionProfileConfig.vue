<script setup lang="ts">
import { Gauge } from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemoryCognitionProfileConfigProps } from './MemoryCognitionProfileConfig.types';

defineProps<MemoryCognitionProfileConfigProps>();
</script>

<template>
  <div class="memory-cognition-profile-config">
    <SectionHeader
      :icon="Gauge"
      :title="$t('common.memoryCognitionProfileSection')"
    />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="Gauge"
        :label="$t('common.memoryCognitionCap')"
        :description="$t('common.memoryCognitionCapDesc')"
        :number-value="cognitionLimit"
        :number-min="500"
        :number-max="32000"
        :show-checkbox="false"
        @update:number-value="onSaveCognitionLimit"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-cognition-profile-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
