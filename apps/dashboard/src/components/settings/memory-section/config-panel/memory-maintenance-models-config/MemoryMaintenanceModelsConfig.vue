<script setup lang="ts">
import { Cpu, GitBranch, Scale, Sparkles, Tags, Workflow } from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import ModelFieldCard from '@/components/shared/ui/model-field-card/ModelFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import type { MemoryMaintenanceModelsConfigProps } from './MemoryMaintenanceModelsConfig.types';

defineProps<MemoryMaintenanceModelsConfigProps>();
</script>

<template>
  <div class="memory-maintenance-models-config">
    <SectionHeader :icon="Cpu" :title="$t('common.memoryMaintenanceModels')" />
    <FieldGrid :items-per-row="2">
      <ModelFieldCard
        :icon="Workflow"
        :label="$t('common.memoryConsolidateModel')"
        :description="$t('common.memoryConsolidateModelDesc')"
        :model-value="consolidateModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveConsolidateModel"
      />
      <ModelFieldCard
        :icon="Tags"
        :label="$t('common.memoryClassifyModel')"
        :description="$t('common.memoryClassifyModelDesc')"
        :model-value="classifyModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveClassifyModel"
      />
      <ModelFieldCard
        :icon="Scale"
        :label="$t('common.memoryReflectModel')"
        :description="$t('common.memoryReflectModelDesc')"
        :model-value="reflectModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveReflectModel"
      />
      <ModelFieldCard
        :icon="Sparkles"
        :label="$t('common.memoryConvictionModel')"
        :description="$t('common.memoryConvictionModelDesc')"
        :model-value="convictionModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveConvictionModel"
      />
      <ModelFieldCard
        :icon="GitBranch"
        :label="$t('common.memoryClusterModel')"
        :description="$t('common.memoryClusterModelDesc')"
        :model-value="clusterModel"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :default-label="$t('common.memoryModelDefault')"
        @update:model-value="onSaveClusterModel"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-maintenance-models-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
