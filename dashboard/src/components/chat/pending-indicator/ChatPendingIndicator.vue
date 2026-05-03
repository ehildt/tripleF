<script setup lang="ts">
/**
 * Pending indicator component - shows animated loading bar for pending requests
 */

defineProps<{
  variant?: 'default' | 'aborting';
}>();
</script>

<template>
  <button class="flex items-center" style="cursor: default">
    <span class="w-8 h-1.5 relative overflow-hidden bg-tertiary">
      <span
        class="absolute top-0 left-0 h-full w-1/2 animate-battery-slide"
        :class="variant === 'aborting' ? 'bg-loading-secondary' : 'bg-loading'"
      ></span>
    </span>
  </button>
</template>
