<script setup lang="ts">
import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import {
  PREPROCESSING_SIZES,
  type PreprocessingSize,
} from '@/stores/preprocessing';

const props = defineProps<{
  modelValue: PreprocessingSize;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PreprocessingSize): void;
}>();

function handleChange(value: string) {
  const num = parseInt(value, 10) as PreprocessingSize;
  if (PREPROCESSING_SIZES.includes(num)) {
    emit('update:modelValue', num);
  }
}
</script>

<template>
  <InputSelect
    :model-value="props.modelValue.toString()"
    :options="PREPROCESSING_SIZES.map(String)"
    :disabled="props.disabled"
    placeholder="768"
    @update:model-value="handleChange"
  />
</template>
