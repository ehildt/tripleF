<script setup lang="ts">
import { Brain, GitBranch, Sparkles, Tags, Workflow, Zap } from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemoryAutoTriggersConfigProps } from './MemoryAutoTriggersConfig.types';

defineProps<MemoryAutoTriggersConfigProps>();
</script>

<template>
  <div class="memory-auto-triggers-config">
    <SectionHeader :icon="Zap" :title="$t('common.memoryAutoTriggers')" />
    <FieldGrid :items-per-row="2">
      <NumberFieldCard
        :icon="Workflow"
        :label="$t('common.memoryPartitionReflectAuto')"
        :description="$t('common.memoryPartitionReflectAutoDesc')"
        :checked="partitionReflectAutoEnabled"
        @toggle="
          onSavePartitionReflectAutoEnabled(!partitionReflectAutoEnabled)
        "
      />
      <NumberFieldCard
        :icon="Brain"
        :label="$t('common.memoryCognitionReflectAuto')"
        :description="$t('common.memoryCognitionReflectAutoDesc')"
        :checked="cognitionReflectAutoEnabled"
        @toggle="
          onSaveCognitionReflectAutoEnabled(!cognitionReflectAutoEnabled)
        "
      />
      <NumberFieldCard
        :icon="Tags"
        :label="$t('common.memoryEncyclopediaReflectAuto')"
        :description="$t('common.memoryEncyclopediaReflectAutoDesc')"
        :checked="encyclopediaReflectAutoEnabled"
        @toggle="
          onSaveEncyclopediaReflectAutoEnabled(!encyclopediaReflectAutoEnabled)
        "
      />
      <NumberFieldCard
        :icon="Sparkles"
        :label="$t('common.memoryConvictionAuto')"
        :description="$t('common.memoryConvictionAutoDesc')"
        :checked="convictionAutoEnabled"
        @toggle="onSaveConvictionAutoEnabled(!convictionAutoEnabled)"
      />
      <NumberFieldCard
        :icon="GitBranch"
        :label="$t('common.memoryClusterAuto')"
        :description="$t('common.memoryClusterAutoDesc')"
        :checked="clusterAutoEnabled"
        @toggle="onSaveClusterAutoEnabled(!clusterAutoEnabled)"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-auto-triggers-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
