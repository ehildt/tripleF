<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';

defineProps<{
  title: string;
  count?: number;
}>();
</script>

<template>
  <div
    class="px-4 py-3 bg-secondary border-b border-divider flex items-center gap-2 font-mono"
  >
    <slot name="icon">
      <ChevronRight class="w-4 h-4 text-tab-rest" />
    </slot>
    <span class="text-sm text-tab-rest">{{ title }}</span>
    <span v-if="count !== undefined && count > 0" class="text-tab-rest text-xs">
      [{{ count }}]
    </span>
    <div class="flex-1" />
    <slot name="actions" />
  </div>
</template>
