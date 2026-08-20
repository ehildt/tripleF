<script setup lang="ts">
import { ScanSearch } from '@lucide/vue';

import IconButton from '../icon-button/IconButton.vue';

/**
 * Panel-header preview icon button, next to the reset button. When `active`,
 * the preview it toggles is currently shown — the button keeps the scan icon
 * and relies on the active state styling to read as "hide the preview".
 */
withDefaults(
  defineProps<{
    title?: string;
    disabled?: boolean;
    active?: boolean;
  }>(),
  { title: 'Show an example', active: false },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <IconButton
    :title="title"
    :disabled="disabled"
    :active="active"
    :aria-label="title"
    :aria-pressed="active"
    @click="emit('click')"
  >
    <ScanSearch />
  </IconButton>
</template>
