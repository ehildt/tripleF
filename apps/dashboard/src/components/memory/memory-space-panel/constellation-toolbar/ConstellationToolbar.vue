<script setup lang="ts">
/**
 * The shared action row for the three memory spaces: reload, label toggle,
 * expand/collapse-all topics, view reset, rotation toggle, and the optional
 * armed two-click wipe (read-only spaces omit `wipeTitle`).
 */
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  RefreshCw,
  Rotate3d,
  Shrink,
  Tags,
  Trash2,
  Zap,
} from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type {
  ConstellationToolbarEmits,
  ConstellationToolbarProps,
} from './ConstellationToolbar.types';

defineProps<ConstellationToolbarProps>();
const emit = defineEmits<ConstellationToolbarEmits>();
</script>

<template>
  <IconButton
    :title="refreshTitle"
    :disabled="isRefreshDisabled"
    size="sm"
    @click="emit('refresh')"
  >
    <RefreshCw />
  </IconButton>
  <IconButton
    :title="$t('common.memoryToggleLabels')"
    :active="showLabels"
    size="sm"
    @click="emit('toggleLabels')"
  >
    <Tags />
  </IconButton>
  <IconButton
    :title="
      isAllExpanded
        ? $t('common.memoryCollapseAll')
        : $t('common.memoryExpandAll')
    "
    :active="isAllExpanded"
    size="sm"
    @click="emit('toggleAllTopics')"
  >
    <ChevronsDownUp v-if="isAllExpanded" />
    <ChevronsUpDown v-else />
  </IconButton>
  <IconButton
    :title="
      strictMode
        ? $t('common.memoryRecommendedView')
        : $t('common.memoryStrictView')
    "
    :active="strictMode"
    size="sm"
    @click="emit('toggleStrictMode')"
  >
    <Filter />
  </IconButton>
  <IconButton
    :title="$t('common.memoryToggleSuggested')"
    :active="showSuggested"
    size="sm"
    @click="emit('toggleSuggested')"
  >
    <Zap />
  </IconButton>
  <IconButton
    :title="$t('common.memoryResetView')"
    size="sm"
    @click="emit('resetView')"
  >
    <Shrink />
  </IconButton>
  <IconButton
    :title="$t('common.memoryToggleRotation')"
    :active="rotationEnabled"
    size="sm"
    @click="emit('toggleRotation')"
  >
    <Rotate3d />
  </IconButton>
  <IconButton
    v-if="wipeTitle"
    danger
    size="sm"
    :armed="wipeArmed"
    :disabled="isWipeDisabled"
    :title="wipeArmed ? $t('common.clickAgainConfirmDelete') : wipeTitle"
    @click="emit('wipe')"
  >
    <Trash2 />
  </IconButton>
</template>
