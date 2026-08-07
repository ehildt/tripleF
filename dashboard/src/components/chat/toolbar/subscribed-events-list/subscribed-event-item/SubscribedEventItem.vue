<script setup lang="ts">
import { CaseUpper, MessageSquareText, Radio, Tag, Type, X } from '@lucide/vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

export interface SubscriptionEntry {
  event: string;
  roomId: string;
  active: boolean;
  stream: boolean;
}

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
  <div
    class="subscribed-event-item"
    :class="{ 'subscribed-event-item--inactive': !subscription.active }"
    @click="$emit('toggleStream')"
  >
    <div class="subscribed-event-item__content">
      <div class="subscribed-event-item__header">
        <Radio
          :class="[
            'subscribed-event-item__radio',
            subscription.active
              ? 'subscribed-event-item__radio--active'
              : 'subscribed-event-item__radio--inactive',
          ]"
          @click.stop="$emit('toggleActive')"
        />
        <span class="subscribed-event-item__event-name">{{
          subscription.event
        }}</span>
        <Tooltip
          :text="
            subscription.stream ? 'Streaming per word' : 'Full response at once'
          "
        >
          <span class="subscribed-event-item__stream-indicator">
            <CaseUpper v-if="subscription.stream" class="w-2.5 h-2.5" />
            <Type v-else class="w-2.5 h-2.5" />
          </span>
        </Tooltip>
        <Tooltip
          :text="$t('common.unsubscribeFrom', { event: subscription.event })"
        >
          <button
            class="subscribed-event-item__remove"
            :aria-label="
              $t('common.unsubscribeFrom', { event: subscription.event })
            "
            @click.stop="$emit('remove')"
          >
            <X class="w-3 h-3" />
          </button>
        </Tooltip>
      </div>
      <div v-if="subscription.roomId" class="subscribed-event-item__meta">
        <Tag class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ subscription.roomId }}</span>
      </div>
      <div v-if="conversationNames.length" class="subscribed-event-item__meta">
        <MessageSquareText class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ conversationNames.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subscribed-event-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.subscribed-event-item--inactive {
  opacity: 0.7;
}

.subscribed-event-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.subscribed-event-item__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
}

.subscribed-event-item__radio {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  cursor: pointer;
}

.subscribed-event-item__radio--active {
  color: var(--color-accent-primary);
}

.subscribed-event-item__radio--inactive {
  color: var(--color-fg-muted);
}

.subscribed-event-item__event-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subscribed-event-item__stream-indicator {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 10px;
  color: var(--color-fg-muted);
}

.subscribed-event-item__remove {
  padding: 0.125rem;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.subscribed-event-item__remove:hover {
  color: var(--color-accent-primary);
}

.subscribed-event-item__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  font-size: 10px;
  color: var(--color-fg-muted);
}
</style>
