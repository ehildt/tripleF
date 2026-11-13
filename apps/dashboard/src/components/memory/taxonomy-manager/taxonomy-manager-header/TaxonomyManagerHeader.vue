<script setup lang="ts">
/**
 * The taxonomy manager's shared space header: independent Partition,
 * Encyclopedia, and Tags selectors plus manual refresh. Each selector emits
 * its own intent; the route-backed composable owns the resulting navigation.
 */
import { Brain, FolderTree, Network, RefreshCw, Tags } from '@lucide/vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';

import SpaceHeader from '../../shared/ui/space-header/SpaceHeader.vue';
import type {
  TaxonomyManagerHeaderEmits,
  TaxonomyManagerHeaderProps,
} from './TaxonomyManagerHeader.types';

defineProps<TaxonomyManagerHeaderProps>();
const emit = defineEmits<TaxonomyManagerHeaderEmits>();
</script>

<template>
  <SpaceHeader
    :icon="FolderTree"
    :label="$t('common.memoryTaxonomyManager')"
    :description="$t('common.memoryTaxonomyManagerDesc')"
  >
    <MenuRow
      variant="header"
      role="toolbar"
      :aria-label="$t('common.memoryTaxonomyManager')"
    >
      <MenuButton
        :icon="Brain"
        :label="$t('common.settingsMemoryPartition')"
        :active="isPartitionView"
        @click="emit('showPartition')"
      />
      <MenuButton
        :icon="Network"
        :label="$t('common.settingsMemoryEncyclopedia')"
        :active="isEncyclopediaView"
        @click="emit('showEncyclopedia')"
      />
      <MenuButton
        :icon="Tags"
        :label="$t('common.memoryTaxonomyTags')"
        :active="isTagsView"
        @click="emit('showTags')"
      />
      <MenuButton
        :icon="RefreshCw"
        :label="$t('common.memoryTaxonomyRefresh')"
        :loading="isLoading"
        @click="emit('refresh')"
      />
    </MenuRow>
  </SpaceHeader>
</template>
