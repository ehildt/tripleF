<script lang="ts" setup>
import type { PanelHeaderTitleProps } from './PanelHeaderTitle.types';

defineProps<PanelHeaderTitleProps>();
</script>

<template>
  <div class="flex items-center gap-2 font-mono">
    <span class="text-xs text-accent-primary uppercase tracking-wider">{{
      label
    }}</span>
  </div>
</template>
