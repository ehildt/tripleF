<script setup lang="ts">
import {
  Filter,
  Flame,
  GitBranch,
  Layers,
  ListChecks,
  Scale,
  Sparkles,
  Workflow,
} from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemorySweepLimitsConfigProps } from './MemorySweepLimitsConfig.types';

defineProps<MemorySweepLimitsConfigProps>();
</script>

<template>
  <div class="memory-sweep-limits-config">
    <SectionHeader :icon="ListChecks" :title="$t('common.memorySweepLimits')" />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="Scale"
        :label="$t('common.memoryReflectBatchLimit')"
        :description="$t('common.memoryReflectBatchLimitDesc')"
        :number-value="reflectBatchLimit"
        :number-step="1"
        :number-min="1"
        :number-max="500"
        :show-checkbox="false"
        @update:number-value="onSaveReflectBatchLimit"
      />
      <NumberFieldCard
        :icon="Filter"
        :label="$t('common.memoryReflectMaxCandidates')"
        :description="$t('common.memoryReflectMaxCandidatesDesc')"
        :number-value="reflectMaxCandidates"
        :number-step="1"
        :number-min="1"
        :number-max="100"
        :show-checkbox="false"
        @update:number-value="onSaveReflectMaxCandidates"
      />
      <NumberFieldCard
        :icon="Sparkles"
        :label="$t('common.memoryConvictionBatchLimit')"
        :description="$t('common.memoryConvictionBatchLimitDesc')"
        :number-value="convictionBatchLimit"
        :number-step="1"
        :number-min="1"
        :number-max="500"
        :show-checkbox="false"
        @update:number-value="onSaveConvictionBatchLimit"
      />
      <NumberFieldCard
        :icon="Layers"
        :label="$t('common.memoryConvictionMaxPerCluster')"
        :description="$t('common.memoryConvictionMaxPerClusterDesc')"
        :number-value="convictionMaxPerCluster"
        :number-step="1"
        :number-min="1"
        :number-max="1000"
        :show-checkbox="false"
        @update:number-value="onSaveConvictionMaxPerCluster"
      />
      <NumberFieldCard
        :icon="GitBranch"
        :label="$t('common.memoryClusterMinMembers')"
        :description="$t('common.memoryClusterMinMembersDesc')"
        :number-value="clusterMinMembers"
        :number-step="1"
        :number-min="1"
        :number-max="100"
        :show-checkbox="false"
        @update:number-value="onSaveClusterMinMembers"
      />
      <NumberFieldCard
        :icon="Workflow"
        :label="$t('common.memoryRaptorEnabled')"
        :description="$t('common.memoryRaptorEnabledDesc')"
        :checked="raptorEnabled"
        @toggle="onSaveRaptorEnabled(!raptorEnabled)"
      />
      <NumberFieldCard
        :icon="Flame"
        :label="$t('common.memoryHeatTrackingEnabled')"
        :description="$t('common.memoryHeatTrackingEnabledDesc')"
        :checked="heatTrackingEnabled"
        @toggle="onSaveHeatTrackingEnabled(!heatTrackingEnabled)"
      />
      <NumberFieldCard
        :icon="Layers"
        :label="$t('common.memoryRaptorMaxDepth')"
        :description="$t('common.memoryRaptorMaxDepthDesc')"
        :number-value="raptorMaxDepth"
        :number-step="1"
        :number-min="1"
        :number-max="3"
        :show-checkbox="false"
        @update:number-value="onSaveRaptorMaxDepth"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-sweep-limits-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
