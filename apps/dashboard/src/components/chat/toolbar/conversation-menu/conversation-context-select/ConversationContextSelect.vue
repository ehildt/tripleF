<script setup lang="ts">
import { CircleGauge } from '@lucide/vue';

import DropDown from '../../../../shared/ui/drop-down/DropDown.vue';
import type { ConversationContextSelectProps } from './ConversationContextSelect.types';

defineProps<ConversationContextSelectProps>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <DropDown
    :label="$t('common.context')"
    menu-style="centered"
    :options="options"
    :model-value="modelValue"
    :format-value="formatValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <CircleGauge class="w-3.5 h-3.5" />
  </DropDown>
</template>
