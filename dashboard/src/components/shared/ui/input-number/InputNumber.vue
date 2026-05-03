<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue';

const props = defineProps<{
  modelValue: number;
  placeholder?: string;
  disabled?: boolean;
  step?: number | string;
  min?: number | string;
  max?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  if (value === '') {
    return;
  }

  const num = parseFloat(value);
  if (!isNaN(num)) {
    emit('update:modelValue', num);
  }
}

function stepUp() {
  const stepVal =
    typeof props.step === 'string' ? parseFloat(props.step) : (props.step ?? 1);
  const newValue = props.modelValue + stepVal;

  if (props.max !== undefined) {
    const maxVal =
      typeof props.max === 'string' ? parseFloat(props.max) : props.max;
    if (newValue > maxVal) return;
  }

  // Round to 1 decimal place to avoid floating point issues
  emit('update:modelValue', Math.round(newValue * 10) / 10);
}

function stepDown() {
  const stepVal =
    typeof props.step === 'string' ? parseFloat(props.step) : (props.step ?? 1);
  const newValue = props.modelValue - stepVal;

  if (props.min !== undefined) {
    const minVal =
      typeof props.min === 'string' ? parseFloat(props.min) : props.min;
    if (newValue < minVal) return;
  }

  // Round to 1 decimal place to avoid floating point issues
  emit('update:modelValue', Math.round(newValue * 10) / 10);
}
</script>

<template>
  <div class="relative">
    <input
      type="number"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"
      class="w-full px-3 py-2 bg-primary border border-divider rounded-none text-sm text-fg-primary text-center focus:outline-none focus:border-[var(--color-accent-active)] focus:ring-1 focus:ring-[var(--color-accent-active)] transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed pr-8"
      @input="handleInput"
    />
    <div class="absolute right-0 top-0 bottom-0 flex flex-col w-6">
      <button
        type="button"
        :disabled="disabled"
        class="flex-1 flex items-center justify-center text-fg-muted hover:text-fg-primary hover:bg-fg-muted/10 disabled:text-fg-muted/30 disabled:cursor-not-allowed transition-colors border-l border-b border-divider"
        @click="stepUp"
      >
        <ChevronUp class="w-3 h-3" />
      </button>
      <button
        type="button"
        :disabled="disabled"
        class="flex-1 flex items-center justify-center text-fg-muted hover:text-fg-primary hover:bg-fg-muted/10 disabled:text-fg-muted/30 disabled:cursor-not-allowed transition-colors border-l border-divider"
        @click="stepDown"
      >
        <ChevronDown class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>
