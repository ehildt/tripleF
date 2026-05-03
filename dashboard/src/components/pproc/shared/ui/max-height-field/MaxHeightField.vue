<script setup lang="ts">
import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import { PREPROCESSING_SIZES } from '@/stores/preprocessing';

const props = defineProps<{
  modelValue: number | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const HEIGHT_OPTIONS = ['AUTO', ...PREPROCESSING_SIZES.map(String)];

function handleChange(value: string) {
  if (value === 'AUTO') {
    emit('update:modelValue', null);
  } else {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      emit('update:modelValue', num);
    }
  }
}
</script>

<template>
  <div class="space-y-1.5 h-full flex flex-col justify-center">
    <label
      class="text-xs font-medium text-fg-secondary font-mono uppercase tracking-wider"
      >Max Height</label
    >
    <InputSelect
      :model-value="props.modelValue?.toString() ?? 'AUTO'"
      :options="HEIGHT_OPTIONS"
      :disabled="props.disabled"
      placeholder="AUTO"
      @update:model-value="handleChange"
    />
  </div>
</template>
