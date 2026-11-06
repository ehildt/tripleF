<script setup lang="ts">
import {
  Clock,
  Filter,
  History,
  Layers,
  Scale,
  SlidersHorizontal,
} from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemoryEpisodeProbeConfigProps } from './MemoryEpisodeProbeConfig.types';

defineProps<MemoryEpisodeProbeConfigProps>();
</script>

<template>
  <div class="memory-episode-probe-config">
    <SectionHeader
      :icon="History"
      :title="$t('common.memoryEpisodeProbeSection')"
    />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="Scale"
        :label="$t('common.episodeRecencyWeight')"
        :description="$t('common.episodeRecencyWeightDesc')"
        :number-value="episodeRecencyWeight"
        :number-step="0.05"
        :number-min="0"
        :number-max="1"
        :show-checkbox="false"
        @update:number-value="onSaveEpisodeRecencyWeight"
      />
      <NumberFieldCard
        :icon="Clock"
        :label="$t('common.episodeRecencyScale')"
        :description="$t('common.episodeRecencyScaleDesc')"
        :number-value="episodeRecencyScaleSeconds"
        :number-step="86400"
        :number-min="60"
        :number-max="31536000"
        :show-checkbox="false"
        @update:number-value="onSaveEpisodeRecencyScaleSeconds"
      />
      <NumberFieldCard
        :icon="SlidersHorizontal"
        :label="$t('common.episodeRecencyMidpoint')"
        :description="$t('common.episodeRecencyMidpointDesc')"
        :number-value="episodeRecencyMidpoint"
        :number-step="0.01"
        :number-min="0.01"
        :number-max="0.99"
        :show-checkbox="false"
        @update:number-value="onSaveEpisodeRecencyMidpoint"
      />
      <NumberFieldCard
        :icon="Layers"
        :label="$t('common.episodeProbeLimit')"
        :description="$t('common.episodeProbeLimitDesc')"
        :number-value="episodeProbeLimit"
        :number-step="1"
        :number-min="0"
        :show-checkbox="false"
        @update:number-value="onSaveEpisodeProbeLimit"
      />
      <NumberFieldCard
        :icon="Filter"
        :label="$t('common.episodeScoreThreshold')"
        :description="$t('common.episodeScoreThresholdDesc')"
        :number-value="episodeScoreThreshold"
        :number-step="0.05"
        :number-min="0"
        :number-max="1"
        :show-checkbox="false"
        @update:number-value="onSaveEpisodeScoreThreshold"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-episode-probe-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
