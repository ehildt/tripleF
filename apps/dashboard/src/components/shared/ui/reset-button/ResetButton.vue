<script setup lang="ts">
import { RotateCcw } from '@lucide/vue';

import IconButton from '../icon-button/IconButton.vue';
import type { ResetButtonEmits, ResetButtonProps } from './ResetButton.types';

/** Panel-header reset icon button, next to the power toggle. */
withDefaults(defineProps<ResetButtonProps>(), {
  title: 'Reset to defaults',
});

const emit = defineEmits<ResetButtonEmits>();
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
