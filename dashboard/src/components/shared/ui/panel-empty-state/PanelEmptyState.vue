<script lang="ts" setup>
import { ShieldCheck } from '@lucide/vue';

withDefaults(defineProps<{ message?: string; submessage?: string }>(), {
  message: 'No requests yet',
  submessage: 'Send a request to see results',
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-12 h-12 bg-tertiary flex items-center justify-center mb-3">
      <ShieldCheck class="w-6 h-6 text-fg-muted" />
    </div>
    <p class="text-sm text-fg-muted font-mono">
      {{ message }}
    </p>
    <p class="text-xs text-fg-muted/70 mt-1 font-mono">
      {{ submessage }}
    </p>
  </div>
</template>
