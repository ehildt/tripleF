<script setup lang="ts">
defineProps<{
  selected: boolean;
  disabled?: boolean;
  highlighted?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="w-full h-full relative p-3 border transition-all duration-200 text-left group overflow-hidden"
    :class="[
      disabled
        ? 'bg-primary/50 border-divider/50 cursor-not-allowed opacity-60'
        : selected
          ? 'bg-secondary border-tab-preprocessing/20 hover:brightness-110'
          : 'bg-primary border-divider hover:border-fg-muted/50 cursor-pointer hover:brightness-105',
      highlighted
        ? 'ring-2 ring-tab-preprocessing/50 brightness-110 animate-pulse'
        : '',
    ]"
    @click="!disabled && emit('click')"
  >
    <!-- Selected Glow -->
    <div
      v-if="selected && !disabled"
      class="absolute inset-0 opacity-5 pointer-events-none"
      style="
        background: linear-gradient(
          90deg,
          var(--color-tab-preprocessing) 0%,
          transparent 70%
        );
      "
    ></div>

    <div class="relative flex items-center gap-3">
      <slot name="icon" />
      <div class="flex-1 min-w-0">
        <slot name="content" />
      </div>
      <slot name="checkbox" />
    </div>
  </button>
</template>
