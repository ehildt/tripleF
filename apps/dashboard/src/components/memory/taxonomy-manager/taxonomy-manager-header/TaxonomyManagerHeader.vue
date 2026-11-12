<script setup lang="ts">
/**
 * The taxonomy manager's shared space header: the memory-lane toggle
 * (partition / encyclopedia) and manual refresh use the same header menu as
 * the other memory spaces. The lane is backed by the route query.
 */
import { Brain, FolderTree, Network, RefreshCw, Tags } from '@lucide/vue';
import { computed } from 'vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';
import { i18n } from '@/i18n/i18n';

import SpaceHeader from '../../shared/ui/space-header/SpaceHeader.vue';
import type { TaxonomyLane } from '../composables/use-taxonomy-manager.types';
import type {
  TaxonomyManagerHeaderEmits,
  TaxonomyManagerHeaderProps,
} from './TaxonomyManagerHeader.types';

defineProps<TaxonomyManagerHeaderProps>();
const emit = defineEmits<TaxonomyManagerHeaderEmits>();
const lane = defineModel<TaxonomyLane>('lane', { required: true });

/** The lane segments of the memory-lane toggle. */
const LANE_OPTIONS = computed(() => [
  {
    value: 'partition' as const,
    icon: Brain,
    tooltip: i18n.global.t('common.settingsMemoryPartition'),
  },
  {
    value: 'encyclopedia' as const,
    icon: Network,
    tooltip: i18n.global.t('common.settingsMemoryEncyclopedia'),
  },
]);
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
        v-for="option in LANE_OPTIONS"
        :key="option.value"
        :icon="option.icon"
        :label="option.tooltip"
        :active="!isTagsView && lane === option.value"
        @click="lane = option.value"
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
