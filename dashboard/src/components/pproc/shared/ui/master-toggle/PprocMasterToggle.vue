<script setup lang="ts">
import { Check } from '@lucide/vue';

defineProps<{
  enabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="w-full relative overflow-hidden p-4 border-2 border-divider transition-all duration-200 text-left group"
    :class="[
      enabled
        ? 'bg-secondary border-tab-preprocessing/20'
        : 'bg-primary border-divider hover:border-fg-muted/50',
    ]"
    @click="emit('toggle')"
  >
    <!-- Glow Effect -->
    <div
      v-if="enabled"
      class="absolute inset-0 opacity-5 pointer-events-none"
      style="
        background: linear-gradient(
          135deg,
          var(--color-tab-preprocessing) 0%,
          transparent 60%
        );
      "
    ></div>

    <div class="relative flex items-center gap-4">
      <!-- Icon -->
      <div
        class="w-10 h-10 flex items-center justify-center transition-all duration-200"
        :class="[
          enabled
            ? 'bg-tab-preprocessing/20 text-tab-preprocessing'
            : 'bg-fg-muted/10 text-fg-muted group-hover:text-fg-secondary',
        ]"
      >
        <slot name="icon" />
      </div>

      <!-- Content -->
      <div class="flex-1">
        <span
          class="block font-mono font-bold text-sm"
          :class="enabled ? 'text-fg-primary' : 'text-fg-secondary'"
        >
          <slot name="title" />
        </span>
        <span class="block text-[10px] font-mono text-fg-muted mt-0.5">
          <slot name="description" />
        </span>
      </div>

      <!-- Checkbox -->
      <div
        class="w-6 h-6 border-2 flex items-center justify-center transition-all duration-200"
        :class="[
          enabled
            ? 'bg-tab-preprocessing border-tab-preprocessing'
            : 'border-fg-muted group-hover:border-fg-secondary',
        ]"
      >
        <Check
          v-if="enabled"
          class="w-4 h-4 text-fg-inverse"
          stroke-width="3"
        />
      </div>
    </div>
  </button>
</template>
