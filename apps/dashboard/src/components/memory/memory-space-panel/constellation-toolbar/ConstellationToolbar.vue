<script setup lang="ts">
/**
 * The shared header action menu for the three memory spaces: reload, label
 * toggle, expand/collapse-all topics, view reset, rotation toggle, and the
 * optional armed two-click wipe (read-only spaces omit `wipeTitle`).
 */
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Flame,
  RefreshCw,
  Rotate3d,
  Shrink,
  Tags,
  Trash2,
  Zap,
} from '@lucide/vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';

import type {
  ConstellationToolbarEmits,
  ConstellationToolbarProps,
} from './ConstellationToolbar.types';

defineProps<ConstellationToolbarProps>();
const emit = defineEmits<ConstellationToolbarEmits>();
</script>

<template>
  <MenuRow variant="header" role="toolbar">
    <MenuButton
      :icon="RefreshCw"
      :label="refreshTitle"
      :disabled="isRefreshDisabled"
      @click="emit('refresh')"
    />
    <MenuButton
      :icon="Tags"
      :label="$t('common.memoryToggleLabels')"
      :active="showLabels"
      @click="emit('toggleLabels')"
    />
    <MenuButton
      :icon="isAllExpanded ? ChevronsDownUp : ChevronsUpDown"
      :label="
        isAllExpanded
          ? $t('common.memoryCollapseAll')
          : $t('common.memoryExpandAll')
      "
      :active="isAllExpanded"
      @click="emit('toggleAllTopics')"
    />
    <MenuButton
      :icon="Filter"
      :label="
        strictMode
          ? $t('common.memoryRecommendedView')
          : $t('common.memoryStrictView')
      "
      :active="strictMode"
      @click="emit('toggleStrictMode')"
    />
    <MenuButton
      :icon="Zap"
      :label="$t('common.memoryToggleSuggested')"
      :active="showSuggested"
      @click="emit('toggleSuggested')"
    />
    <MenuButton
      :icon="Flame"
      :label="$t('common.memoryToggleHeat')"
      :active="showHeat"
      @click="emit('toggleHeat')"
    />
    <MenuButton
      :icon="Shrink"
      :label="$t('common.memoryResetView')"
      @click="emit('resetView')"
    />
    <MenuButton
      :icon="Rotate3d"
      :label="$t('common.memoryToggleRotation')"
      :active="rotationEnabled"
      @click="emit('toggleRotation')"
    />
    <MenuButton
      v-if="wipeTitle"
      :icon="Trash2"
      danger
      :armed="wipeArmed"
      :disabled="isWipeDisabled"
      :label="wipeArmed ? $t('common.clickAgainConfirmDelete') : wipeTitle"
      @click="emit('wipe')"
    />
  </MenuRow>
</template>
