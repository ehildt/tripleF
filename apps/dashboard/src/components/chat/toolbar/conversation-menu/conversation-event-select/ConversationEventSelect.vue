<script setup lang="ts">
import { Radio } from '@lucide/vue';

import ComboBox from '../../../../shared/ui/combo-box/ComboBox.vue';
import type { ConversationEventSelectProps } from './ConversationEventSelect.types';

defineProps<ConversationEventSelectProps>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <ComboBox
    :model-value="modelValue"
    :options="options"
    placeholder="socket"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <Radio class="w-3.5 h-3.5" />
  </ComboBox>
</template>
