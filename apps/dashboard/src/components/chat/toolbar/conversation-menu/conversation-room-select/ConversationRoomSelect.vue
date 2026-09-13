<script setup lang="ts">
import { Hash } from '@lucide/vue';

import ComboBox from '../../../../shared/ui/combo-box/ComboBox.vue';
import type { ConversationRoomSelectProps } from './ConversationRoomSelect.types';

defineProps<ConversationRoomSelectProps>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <ComboBox
    :model-value="modelValue"
    :options="options"
    placeholder="channel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <Hash class="w-3.5 h-3.5" />
  </ComboBox>
</template>
