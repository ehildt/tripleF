<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
  icon: LucideIcon;
  title: string;
}>();
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-fg-secondary">
        <component :is="icon" class="w-4 h-4" />
        <span class="text-xs font-mono font-bold uppercase tracking-wider">
          {{ title }}
        </span>
      </div>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>
