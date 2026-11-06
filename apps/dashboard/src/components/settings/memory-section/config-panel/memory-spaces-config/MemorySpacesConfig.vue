<script setup lang="ts">
import { Brain, Database, Fingerprint } from '@lucide/vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';

import SpaceSelectorCard from '../space-selector-card/SpaceSelectorCard.vue';
import type { MemorySpacesConfigProps } from './MemorySpacesConfig.types';

defineProps<MemorySpacesConfigProps>();

/** Partition identity key shared with the parent through v-model. */
const memoryPartition = defineModel<string>('memoryPartition', {
  required: true,
});
</script>

<template>
  <div class="memory-spaces-config">
    <SectionHeader :icon="Database" :title="$t('common.memorySpacesSection')" />
    <FieldGrid :items-per-row="2">
      <TextFieldCard
        v-model="memoryPartition"
        :icon="Brain"
        :label="$t('common.memoryPartition')"
        :description="$t('common.memoryPartitionDesc')"
        name="memory-partition"
      />

      <SpaceSelectorCard
        :icon="Fingerprint"
        :label="$t('common.memoryCognition')"
        :description="$t('common.memoryCognitionKeyDesc')"
        :spaces="memoryCognitionSpaces"
        :active-space="memoryCognition"
        :on-select="onSelectMemoryCognition"
        :on-create="onCreateMemoryCognition"
        :on-remove="onRemoveMemoryCognitionSpace"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.memory-spaces-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
