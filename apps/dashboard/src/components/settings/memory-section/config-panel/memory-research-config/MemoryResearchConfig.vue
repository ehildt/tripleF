<script setup lang="ts">
import {
  BrainCircuit,
  Compass,
  Cpu,
  FileDown,
  Globe,
  Layers,
  ListChecks,
  Scale,
} from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import ModelFieldCard from '@/components/shared/ui/model-field-card/ModelFieldCard.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import SelectFieldCard from '@/components/shared/ui/select-field-card/SelectFieldCard.vue';

import type { MemoryResearchConfigProps } from './MemoryResearchConfig.types';

defineProps<MemoryResearchConfigProps>();

/** The search providers the gap-filling researcher can use. */
const RESEARCH_PROVIDER_OPTIONS = ['serper', 'bright-data'];
</script>

<template>
  <div class="memory-research-config">
    <SectionHeader
      :icon="BrainCircuit"
      :title="$t('common.memoryResearchSection')"
    />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="BrainCircuit"
        :label="$t('common.memoryResearchEnabled')"
        :description="$t('common.memoryResearchEnabledDesc')"
        :checked="researchEnabled"
        @toggle="onSaveResearchEnabled(!researchEnabled)"
      />
      <NumberFieldCard
        :icon="Globe"
        :label="$t('common.memoryResearchSearchEnabled')"
        :description="$t('common.memoryResearchSearchEnabledDesc')"
        :checked="researchSearchEnabled"
        @toggle="onSaveResearchSearchEnabled(!researchSearchEnabled)"
      />
      <SelectFieldCard
        :icon="Compass"
        :label="$t('common.memoryResearchProvider')"
        :description="$t('common.memoryResearchProviderDesc')"
        :model-value="researchProvider ?? 'serper'"
        :options="RESEARCH_PROVIDER_OPTIONS"
        @update:model-value="onSaveResearchProvider"
      />
      <ModelFieldCard
        :icon="Cpu"
        :label="$t('common.memoryResearchModel')"
        :description="$t('common.memoryResearchModelDesc')"
        :model-value="researchModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveResearchModel"
      />
      <NumberFieldCard
        :icon="ListChecks"
        :label="$t('common.memoryResearchGapLimit')"
        :description="$t('common.memoryResearchGapLimitDesc')"
        :number-value="researchGapLimit"
        :number-step="1"
        :number-min="1"
        :number-max="50"
        :show-checkbox="false"
        @update:number-value="onSaveResearchGapLimit"
      />
      <NumberFieldCard
        :icon="Layers"
        :label="$t('common.memoryResearchMaxDepth')"
        :description="$t('common.memoryResearchMaxDepthDesc')"
        :number-value="researchMaxDepth"
        :number-step="1"
        :number-min="1"
        :number-max="3"
        :show-checkbox="false"
        @update:number-value="onSaveResearchMaxDepth"
      />
      <NumberFieldCard
        :icon="FileDown"
        :label="$t('common.memoryResearchFetchBudget')"
        :description="$t('common.memoryResearchFetchBudgetDesc')"
        :number-value="researchFetchBudget"
        :number-step="1"
        :number-min="1"
        :number-max="20"
        :show-checkbox="false"
        @update:number-value="onSaveResearchFetchBudget"
      />
      <NumberFieldCard
        :icon="Scale"
        :label="$t('common.memoryResearchFrictionLimit')"
        :description="$t('common.memoryResearchFrictionLimitDesc')"
        :number-value="researchFrictionLimit"
        :number-step="1"
        :number-min="1"
        :number-max="20"
        :show-checkbox="false"
        @update:number-value="onSaveResearchFrictionLimit"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-research-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
