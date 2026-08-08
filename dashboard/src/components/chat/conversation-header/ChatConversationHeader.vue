<script setup lang="ts">
import {
  Form,
  GalleryVerticalEnd,
  LayersArrowDown,
  LayersArrowUp,
  MessagesSquare,
} from '@lucide/vue';
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { ScrollMode } from '@/types/app.model';
import type { MediaPriority } from '@/types/harness-response-data.model';

import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../shared/ui/tooltip/Tooltip.vue';

const props = defineProps<{
  title: string;
  conversationId: string;
}>();

const appStore = useAppStore();

const scrollMode = computed(() =>
  appStore.getConversationScrollMode(props.conversationId),
);

function toggleScrollMode() {
  const next: ScrollMode =
    scrollMode.value === 'carousel' ? 'native' : 'carousel';
  appStore.setConversationScrollMode(props.conversationId, next);
}

const mediaPriority = computed(() =>
  appStore.getConversationMediaPriority(props.conversationId),
);

function toggleMediaPriority() {
  const next: MediaPriority =
    mediaPriority.value === 'images' ? 'videos' : 'images';
  appStore.setConversationMediaPriority(props.conversationId, next);
}
</script>

<template>
  <div class="chat-conversation-header">
    <MessagesSquare class="chat-conversation-header__icon" />
    <span class="chat-conversation-header__title">{{ title }}</span>

    <Tooltip
      :text="
        scrollMode === 'carousel'
          ? $t('common.scrollModeCarousel')
          : $t('common.scrollModeNative')
      "
    >
      <button
        type="button"
        class="chat-conversation-header__scroll-mode"
        :aria-label="
          scrollMode === 'carousel'
            ? $t('common.scrollModeCarousel')
            : $t('common.scrollModeNative')
        "
        @click="toggleScrollMode"
      >
        <MotionIcon>
          <GalleryVerticalEnd
            v-if="scrollMode === 'carousel'"
            class="chat-conversation-header__scroll-mode-icon"
          />
          <Form v-else class="chat-conversation-header__scroll-mode-icon" />
        </MotionIcon>
      </button>
    </Tooltip>

    <Tooltip
      :text="
        mediaPriority === 'images'
          ? $t('common.mediaPriorityImages')
          : $t('common.mediaPriorityVideos')
      "
    >
      <button
        type="button"
        class="chat-conversation-header__media-priority"
        :aria-label="
          mediaPriority === 'images'
            ? $t('common.mediaPriorityImages')
            : $t('common.mediaPriorityVideos')
        "
        @click="toggleMediaPriority"
      >
        <MotionIcon>
          <LayersArrowUp
            v-if="mediaPriority === 'images'"
            class="chat-conversation-header__media-priority-icon"
          />
          <LayersArrowDown
            v-else
            class="chat-conversation-header__media-priority-icon"
          />
        </MotionIcon>
      </button>
    </Tooltip>
  </div>
</template>

<style scoped>
.chat-conversation-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  gap: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  font-family: var(--font-mono);
}

.chat-conversation-header__icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-tab-rest);
  flex-shrink: 0;
}

.chat-conversation-header__title {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  color: var(--color-tab-rest);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-conversation-header__scroll-mode,
.chat-conversation-header__media-priority {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.chat-conversation-header__scroll-mode:hover,
.chat-conversation-header__media-priority:hover {
  color: var(--color-tab-rest);
}

.chat-conversation-header__scroll-mode-icon,
.chat-conversation-header__media-priority-icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
