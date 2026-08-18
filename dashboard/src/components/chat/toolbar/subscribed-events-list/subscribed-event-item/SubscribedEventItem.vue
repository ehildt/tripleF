<script setup lang="ts">
import {
  CaseUpper,
  MessageSquareText,
  Radio,
  Tag,
  Trash2,
  Type,
} from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type { SubscriptionEntry } from '@/types/subscription.model';

defineProps<{
  subscription: SubscriptionEntry;
  conversationNames: string[];
}>();

defineEmits<{
  toggleActive: [];
  toggleStream: [];
  remove: [];
}>();
</script>

<template>
  <!-- Card chrome and layout match the conversation item: a mono single-line
       row with the event name on the left and an icon cluster on the right
       (active radio, stream mode, linked conversations, room, remove). The
       active radio and stream icons are their own toggles. -->
  <div
    class="subscribed-event-item"
    :class="{ 'subscribed-event-item--inactive': !subscription.active }"
  >
    <span class="subscribed-event-item__event-name">{{
      subscription.event
    }}</span>

    <div class="subscribed-event-item__icons">
      <Tooltip
        :text="
          subscription.active
            ? $t('common.activeClickToDeactivate')
            : $t('common.inactiveClickToActivate')
        "
        :positions="['bottom', 'top']"
      >
        <button
          type="button"
          class="subscribed-event-item__radio-toggle"
          :class="{
            'subscribed-event-item__radio-toggle--active': subscription.active,
          }"
          :aria-label="
            subscription.active ? $t('common.active') : $t('common.inactive')
          "
          :aria-pressed="subscription.active"
          @click.stop="$emit('toggleActive')"
        >
          <Radio class="subscribed-event-item__icon" />
        </button>
      </Tooltip>

      <Tooltip
        :text="
          subscription.stream
            ? $t('common.streamingPerWord')
            : $t('common.fullResponseAtOnce')
        "
        :positions="['bottom', 'top']"
      >
        <button
          type="button"
          class="subscribed-event-item__stream-toggle"
          :class="{
            'subscribed-event-item__stream-toggle--on': subscription.stream,
          }"
          :aria-label="
            subscription.stream
              ? $t('common.streamingPerWord')
              : $t('common.fullResponseAtOnce')
          "
          :aria-pressed="subscription.stream"
          @click.stop="$emit('toggleStream')"
        >
          <CaseUpper
            v-if="subscription.stream"
            class="subscribed-event-item__icon"
          />
          <Type v-else class="subscribed-event-item__icon" />
        </button>
      </Tooltip>

      <Tooltip
        v-if="conversationNames.length"
        :text="conversationNames.join(', ')"
        :positions="['bottom', 'top']"
      >
        <MessageSquareText class="subscribed-event-item__icon" />
      </Tooltip>

      <Tooltip
        v-if="subscription.roomId"
        :text="subscription.roomId"
        :positions="['bottom', 'top']"
      >
        <Tag class="subscribed-event-item__icon" />
      </Tooltip>

      <IconButton
        size="sm"
        :title="$t('common.unsubscribeFrom', { event: subscription.event })"
        :tooltip-positions="['bottom', 'top']"
        @click.stop="$emit('remove')"
      >
        <Trash2 />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.subscribed-event-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  /* The row itself is not interactive — only the icon toggles are. */
  cursor: default;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    outline 0.2s ease;
}

.subscribed-event-item:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.subscribed-event-item--inactive {
  opacity: 0.7;
}

.subscribed-event-item__event-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Icon cluster — same size and rhythm as the conversation item icons. */
.subscribed-event-item__icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
}

/* 0.75rem icon, matching .conversation-item__icon. */
.subscribed-event-item__icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.subscribed-event-item__radio-toggle,
.subscribed-event-item__stream-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.subscribed-event-item__radio-toggle--active {
  color: var(--color-accent-primary);
}

/* Stream mode toggle: accent when streaming per word, muted otherwise. */
.subscribed-event-item__stream-toggle--on {
  color: var(--color-accent-primary);
}
</style>
