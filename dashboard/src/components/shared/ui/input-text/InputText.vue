<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="relative w-full">
    <div
      v-if="$slots['prepend-icon']"
      class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10"
    >
      <slot name="prepend-icon" />
    </div>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2 bg-secondary border border-divider rounded-none text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-[var(--color-accent-active)] focus:ring-1 focus:ring-[var(--color-accent-active)] transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{ 'pl-9': $slots['prepend-icon'] }"
      @input="handleInput"
    />
  </div>
</template>
