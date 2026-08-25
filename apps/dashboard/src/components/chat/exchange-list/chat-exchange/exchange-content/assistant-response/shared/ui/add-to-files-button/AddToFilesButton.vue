<script setup lang="ts">
/**
 * Add-to-files membership toggle for image surfaces (gallery tiles, grid
 * tiles, lightbox header): the add/remove icon swap, the i18n labels, the
 * `aria-pressed` state, and the accent highlight all follow from the single
 * `active` prop. The caller owns the files state via `useAddImageToFiles`
 * and wires the `toggle` event. Pointer and click propagation are stopped
 * here so the toggle never engages the media surface behind it (tile
 * lightbox click).
 */
import { ImageMinus, ImagePlus } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type { AddToFilesButtonProps } from './AddToFilesButton.types';

withDefaults(defineProps<AddToFilesButtonProps>(), {
  size: 'lg',
});

const emit = defineEmits<{ toggle: [event: MouseEvent] }>();

function handleClick(event: MouseEvent) {
  event.stopPropagation();
  emit('toggle', event);
}
</script>

<template>
  <IconButton
    :title="active ? $t('common.removeFromFiles') : $t('common.addToFiles')"
    :aria-label="
      active ? $t('common.removeFromFiles') : $t('common.addToFiles')
    "
    :aria-pressed="active"
    :active="active"
    :size="size"
    @pointerdown.stop
    @click="handleClick"
  >
    <ImageMinus v-if="active" />
    <ImagePlus v-else />
  </IconButton>
</template>
