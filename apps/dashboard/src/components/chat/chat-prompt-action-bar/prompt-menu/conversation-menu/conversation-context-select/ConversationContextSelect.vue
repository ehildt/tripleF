<script setup lang="ts">
import { CircleGauge } from '@lucide/vue';

import DropDown from '@/components/shared/ui/drop-down/DropDown.vue';
import { formatContextSize } from '@/utils/format-context-size/format-context-size.helper';

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
    side="top"
    :options="options"
    :model-value="modelValue"
    :format-value="(value) => formatContextSize(Number(value))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <CircleGauge class="conversation-context-select__icon" />
  </DropDown>
</template>

<style scoped>
.conversation-context-select__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
