<script setup lang="ts">
import { RotateCcw } from '@lucide/vue';

import IconButton from '../icon-button/IconButton.vue';

/** Panel-header reset icon button, next to the power toggle. */
withDefaults(
  defineProps<{
    title?: string;
    disabled?: boolean;
  }>(),
  { title: 'Reset to defaults' },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <IconButton
    :title="title"
    :disabled="disabled"
    :aria-label="title"
    @click="emit('click')"
  >
    <RotateCcw />
  </IconButton>
</template>
