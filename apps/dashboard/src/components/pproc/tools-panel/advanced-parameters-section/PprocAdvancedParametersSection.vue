<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue';

import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import { usePreprocessingStore } from '@/stores/preprocessing';

import { PprocAdvancedParameters } from './PprocAdvancedParametersSection.constants';

const store = usePreprocessingStore();
</script>

<template>
  <div class="pproc-advanced-parameters-section">
    <SectionHeader
      :icon="SlidersHorizontal"
      :title="$t('common.advancedParameters')"
    />
    <div class="pproc-advanced-parameters-section__grid">
      <NumberFieldCard
        v-for="param in PprocAdvancedParameters"
        :key="param.key"
        :icon="param.icon"
        :label="param.label"
        :description="param.desc"
        :number-value="store.parameters[param.key]"
        :number-step="'step' in param ? param.step : undefined"
        :number-placeholder="param.placeholder"
        :checked="store.isParameterModified(param.key)"
        :show-checkbox="false"
        :disabled="!store.enabled"
        :highlighted="store.isParameterHighlighted(param.key)"
        tone="preprocessing"
        @update:number-value="store.setParameter(param.key, $event)"
        @mouseenter="store.setHoveredParameter(param.key)"
        @mouseleave="store.setHoveredParameter(null)"
      />
    </div>
  </div>
</template>

<style scoped>
.pproc-advanced-parameters-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.pproc-advanced-parameters-section__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
