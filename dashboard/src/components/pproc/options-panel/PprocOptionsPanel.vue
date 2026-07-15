<script setup lang="ts">
import {
  Activity,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpToLine,
  Columns3,
  Focus,
  Minus,
  Rows3,
  Sun,
  TrendingUp,
  Waves,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';

import { usePreprocessingStore } from '../../../stores/preprocessing';

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
  <div class="bg-elevated border border-divider panel-glow h-fit">
    <PanelTitleBar title="Advanced Parameters">
      <template #actions>
        <button
          class="p-1 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          title="Reset all"
          :disabled="!store.hasAnyParameterModified"
          @click="store.resetParametersToDefaults()"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
        </button>
      </template>
    </PanelTitleBar>

    <div class="p-4 grid grid-cols-3 gap-1">
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
        :disabled="!store.enabled"
        :highlighted="store.isParameterHighlighted(param.key)"
        tone="preprocessing"
        @toggle="store.resetParameter(param.key)"
        @update:number-value="store.setParameter(param.key, $event)"
        @mouseenter="store.setHoveredParameter(param.key)"
        @mouseleave="store.setHoveredParameter(null)"
      />
    </div>
  </div>
</template>
