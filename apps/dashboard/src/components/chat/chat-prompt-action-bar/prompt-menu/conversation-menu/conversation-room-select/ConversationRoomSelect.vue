<script setup lang="ts">
import { Hash } from '@lucide/vue';

import ComboBox from '@/components/shared/ui/combo-box/ComboBox.vue';

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
    side="top"
    placeholder="channel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <Hash class="conversation-room-select__icon" />
  </ComboBox>
</template>

<style scoped>
.conversation-room-select__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
