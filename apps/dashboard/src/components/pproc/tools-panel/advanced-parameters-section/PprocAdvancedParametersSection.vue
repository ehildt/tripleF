<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue';

import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';

import { useParameterHighlight } from '../../composables/use-parameter-highlight';
import { PprocAdvancedParameters } from './PprocAdvancedParametersSection.constants';

const store = usePreprocessingSettingsStore();
const { hoveredParameter, highlightedParameters } = useParameterHighlight();
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
        :highlighted="highlightedParameters.includes(param.key)"
        tone="preprocessing"
        @update:number-value="store.setParameter(param.key, $event)"
        @mouseenter="hoveredParameter = param.key"
        @mouseleave="hoveredParameter = null"
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
