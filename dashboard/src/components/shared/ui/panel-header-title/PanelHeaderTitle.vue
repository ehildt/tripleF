<script lang="ts" setup>
import { ChevronRight } from '@lucide/vue';

defineProps<{ label: string }>();
</script>

<template>
  <div class="flex items-center gap-2 font-mono">
    <ChevronRight class="w-4 h-4 text-accent-primary" />
    <span class="text-xs text-accent-primary uppercase tracking-wider">{{
      label
    }}</span>
  </div>
</template>
