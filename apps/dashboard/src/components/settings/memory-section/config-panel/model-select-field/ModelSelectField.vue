<script setup lang="ts">
import { computed } from 'vue';

import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import { i18n } from '@/i18n/i18n';

import { buildModelSelectOptions } from './helpers/build-model-select-options.helper';
import type {
  ModelSelectFieldEmits,
  ModelSelectFieldProps,
} from './ModelSelectField.types';

/**
 * Model-override picker for the Memory tab: a borderless InputSelect (the
 * preprocessing field look) whose first option is the env-baseline "Default"
 * — picking it clears the override. An override missing from the catalog is
 * appended by buildModelSelectOptions so it stays visible and selectable.
 */
const props = withDefaults(defineProps<ModelSelectFieldProps>(), {
  modelValue: '',
});
const emit = defineEmits<ModelSelectFieldEmits>();

const defaultLabel = computed(() => i18n.global.t('common.memoryModelDefault'));

const selectOptions = computed(() =>
  buildModelSelectOptions(props.options, props.modelValue, defaultLabel.value),
);

/** The empty override renders as the baseline default option. */
const displayValue = computed(() => props.modelValue || defaultLabel.value);

/** Maps the pseudo-option back to an empty override; models pass through. */
function onSelect(value: string) {
  emit('update:modelValue', value === defaultLabel.value ? '' : value);
}
</script>

<template>
  <InputSelect
    :model-value="displayValue"
    :options="selectOptions"
    @update:model-value="onSelect"
  />
</template>
