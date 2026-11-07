<script setup lang="ts">
import { Radio } from '@lucide/vue';

import ComboBox from '@/components/shared/ui/combo-box/ComboBox.vue';

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
    side="top"
    placeholder="socket"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <Radio class="conversation-event-select__icon" />
  </ComboBox>
</template>

<style scoped>
.conversation-event-select__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
