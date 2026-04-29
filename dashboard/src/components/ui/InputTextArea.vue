<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows ?? 3"
    class="w-full px-3 py-2 bg-secondary border border-divider rounded-none text-sm text-fg-primary placeholder:text-left placeholder:text-fg-muted focus:outline-none focus:border-tab-rest focus:ring-1 focus:ring-tab-rest transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed resize-none"
    @input="handleInput"
  />
</template>
