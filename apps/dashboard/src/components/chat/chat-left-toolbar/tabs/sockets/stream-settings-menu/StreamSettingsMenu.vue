<script setup lang="ts">
import { Radio, Tag } from '@lucide/vue';
import { computed } from 'vue';

import ToolbarMenuTrigger from '@/components/chat/chat-left-toolbar/shared/ui/toolbar-menu-trigger/ToolbarMenuTrigger.vue';

import StreamModeToggle from './stream-mode-toggle/StreamModeToggle.vue';
import StreamSubscribeButton from './stream-subscribe-button/StreamSubscribeButton.vue';
import StreamTextInput from './stream-text-input/StreamTextInput.vue';
import type { StreamSettingsMenuProps } from './StreamSettingsMenu.types';

const props = defineProps<StreamSettingsMenuProps>();

const emit = defineEmits<{
  toggleMenu: [];
  close: [];
  'update:isStreamEnabled': [value: boolean];
  'update:newEvent': [value: string];
  'update:newRoomId': [value: string];
  subscribeToEvent: [];
  mouseenter: [];
  mouseleave: [];
}>();

const canSubscribe = computed(() => props.newEvent.trim().length > 0);
</script>

<template>
  <ToolbarMenuTrigger
    :is-open="isOpen"
    :is-disabled="isDisabled"
    :blinking="blinking"
    :title="$t('common.streamTitle')"
    dropdown-width="16rem"
    @toggle-menu="emit('toggleMenu')"
    @close="emit('close')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
  >
    <div class="stream-settings-menu__content">
      <StreamModeToggle
        :model-value="isStreamEnabled"
        @update:model-value="emit('update:isStreamEnabled', $event)"
      />

      <div class="stream-settings-menu__divider"></div>

      <div class="stream-settings-menu__input-row">
        <StreamTextInput
          :model-value="newEvent"
          :icon="Radio"
          name="stream-event"
          :placeholder="$t('common.socket')"
          @update:model-value="emit('update:newEvent', $event)"
        />
        <StreamTextInput
          :model-value="newRoomId"
          :icon="Tag"
          name="stream-channel"
          :placeholder="$t('common.channel')"
          @update:model-value="emit('update:newRoomId', $event)"
        />
      </div>

      <StreamSubscribeButton
        :can-subscribe="canSubscribe"
        @subscribe="emit('subscribeToEvent')"
      />
    </div>
  </ToolbarMenuTrigger>
</template>

<style scoped>
.stream-settings-menu__content {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.stream-settings-menu__divider {
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
}

.stream-settings-menu__input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}
</style>
