<script setup lang="ts">
import {
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  Columns3,
  Focus,
  Minus,
  Rows3,
  SlidersHorizontal,
  Sun,
  TrendingUp,
  Waves,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import { usePreprocessingStore } from '@/stores/preprocessing';

import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';

const store = usePreprocessingStore();

const parameters = [
  {
    key: 'blurSigma',
    icon: Waves,
    label: 'Blur Sigma',
    desc: 'Gaussian blur amount',
    step: 0.1,
    placeholder: '0.5',
  },
  {
    key: 'sharpenSigma',
    icon: Focus,
    label: 'Sharpen Sigma',
    desc: 'Edge radius',
    step: 0.1,
    placeholder: '1.0',
  },
  {
    key: 'sharpenM1',
    icon: Minus,
    label: 'Sharpen M1',
    desc: 'Flat factor',
    step: 0.1,
    placeholder: '1.0',
  },
  {
    key: 'sharpenM2',
    icon: Activity,
    label: 'Sharpen M2',
    desc: 'Edge factor',
    step: 0.1,
    placeholder: '2.0',
  },
  {
    key: 'claheWidth',
    icon: Columns3,
    label: 'CLAHE Width',
    desc: 'Grid width tiles',
    placeholder: '8',
  },
  {
    key: 'claheHeight',
    icon: Rows3,
    label: 'CLAHE Height',
    desc: 'Grid height tiles',
    placeholder: '8',
  },
  {
    key: 'claheMaxSlope',
    icon: TrendingUp,
    label: 'Max Slope',
    desc: 'Contrast limit',
    step: 0.1,
    placeholder: '3.0',
  },
  {
    key: 'brightnessLevel',
    icon: Sun,
    label: 'Brightness',
    desc: 'Brightness mult',
    step: 0.1,
    placeholder: '1.2',
  },
  {
    key: 'normalizeLower',
    icon: ArrowDownToLine,
    label: 'Norm. Lower',
    desc: 'Lower percentile',
    step: 0.1,
    placeholder: '1',
  },
  {
    key: 'normalizeUpper',
    icon: ArrowUpToLine,
    label: 'Norm. Upper',
    desc: 'Upper percentile',
    placeholder: '99',
  },
] as const;
</script>

<template>
  <div class="pproc-advanced-parameters-section">
    <SectionHeader
      :icon="SlidersHorizontal"
      :title="$t('common.advancedParameters')"
    />
    <div class="pproc-advanced-parameters-section__grid">
      <FieldCard
        v-for="param in parameters"
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
