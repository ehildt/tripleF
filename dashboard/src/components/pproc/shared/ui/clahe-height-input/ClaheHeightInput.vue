<script setup lang="ts">
import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';

const props = defineProps<{
  modelValue: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();
</script>

<template>
  <InputNumber
    :model-value="props.modelValue"
    :disabled="props.disabled"
    placeholder="8"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
