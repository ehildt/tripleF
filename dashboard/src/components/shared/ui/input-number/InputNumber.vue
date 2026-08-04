<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue';
import { useId } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    placeholder?: string;
    disabled?: boolean;
    step?: number | string;
    min?: number | string;
    max?: number | string;
    /** Stable id for the field. Auto-generated if omitted. */
    id?: string;
    /** Name attribute, aids browser autofill. */
    name?: string;
  }>(),
  {
    id: () => useId(),
    name: undefined,
    placeholder: undefined,
    step: undefined,
    min: undefined,
    max: undefined,
  },
);

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
  <div class="input-number">
    <input
      :id="id"
      type="number"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"
      class="input-number__field"
      @input="handleInput"
    />
    <div class="input-number__steppers">
      <button
        type="button"
        :disabled="disabled"
        class="input-number__stepper"
        aria-label="Increase value"
        @click="stepUp"
      >
        <ChevronUp class="input-number__stepper-icon" />
      </button>
      <button
        type="button"
        :disabled="disabled"
        class="input-number__stepper"
        aria-label="Decrease value"
        @click="stepDown"
      >
        <ChevronDown class="input-number__stepper-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-number {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* Borderless — the surrounding tile frame IS the field */
.input-number__field {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-align: center;
  outline: none;
}

.input-number__field:disabled {
  opacity: 0.4;
  cursor: default;
}

.input-number__steppers {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.input-number__stepper {
  display: grid;
  place-items: center;
  width: 1rem;
  height: 0.75rem;
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.input-number__stepper:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.input-number__stepper:disabled {
  opacity: 0.4;
  cursor: default;
}

.input-number__stepper-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
