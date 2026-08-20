<script setup lang="ts">
/**
 * Playlist membership toggle for video surfaces (video gallery cards,
 * carousel slides, hero media, the floating media bar): the add/remove icon
 * swap, the i18n labels, the `aria-pressed` state, and the accent highlight
 * all follow from the single `active` prop. The caller owns the playlist
 * state via `usePlaylistToggle` and wires the `toggle` event. Pointer and
 * click propagation are stopped here so the toggle never engages the media
 * surface behind it (poster click, carousel slide focus, bar dragging).
 */
import { ListMinus, ListPlus } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type { PlaylistToggleButtonProps } from './PlaylistToggleButton.types';

withDefaults(defineProps<PlaylistToggleButtonProps>(), {
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
    :title="
      active ? $t('common.removeFromPlaylist') : $t('common.addToPlaylist')
    "
    :aria-label="
      active ? $t('common.removeFromPlaylist') : $t('common.addToPlaylist')
    "
    :aria-pressed="active"
    :active="active"
    :size="size"
    @pointerdown.stop
    @click="handleClick"
  >
    <ListMinus v-if="active" />
    <ListPlus v-else />
  </IconButton>
</template>
