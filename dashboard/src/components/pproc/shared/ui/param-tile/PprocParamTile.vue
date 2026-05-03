<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { RefreshCcw } from '@lucide/vue';

defineProps<{
  icon: LucideIcon;
  label: string;
  description?: string;
  disabled?: boolean;
  highlighted?: boolean;
  modified?: boolean;
}>();

const emit = defineEmits<{
  (e: 'reset'): void;
}>();
</script>

<template>
  <div
    class="group p-3 border border-divider bg-primary h-25 flex flex-col transition-all duration-200"
    :class="[
      highlighted
        ? 'ring-2 ring-tab-preprocessing/50 brightness-110 animate-pulse'
        : '',
    ]"
  >
    <div class="flex items-center gap-2 mb-2">
      <component :is="icon" class="w-4 h-4 text-fg-muted shrink-0" />
      <span
        class="text-xs font-mono font-medium text-fg-secondary flex-1 truncate"
        >{{ label }}</span
      >
      <div class="w-5 h-5 flex items-center justify-center">
        <button
          v-if="modified"
          type="button"
          class="p-1 text-tab-preprocessing/60 hover:text-tab-preprocessing hover:bg-tab-preprocessing/10 rounded-none transition-all duration-200"
          :disabled="disabled"
          @click.stop="emit('reset')"
        >
          <RefreshCcw class="w-4 h-4" stroke-width="3" />
        </button>
      </div>
    </div>
    <slot />
    <p v-if="description" class="text-[10px] font-mono text-fg-muted mt-auto">
      {{ description }}
    </p>
  </div>
</template>
