<script setup lang="ts">
import { computed, useSlots } from 'vue';

import ExpandableMessageListItem from './expandable-message-list-item/ExpandableMessageListItem.vue';
import type { MessageListItem as MessageListItemType } from './types';
import { useExpandableMessageList } from './use-expandable-message-list';

const props = defineProps<{
  items?: string | MessageListItemType[] | Record<string, unknown> | null;
  renderHtml?: (content: string) => string;
  onClick?: (index: number) => void;
  expandAll?: boolean;
}>();

const slots = useSlots();
const hasBody = !!slots.body;

const { messages, expanded, toggle } = useExpandableMessageList(
  computed(() => props.items),
  props.expandAll,
);

function handleSelect(idx: number) {
  props.onClick?.(idx);
}
</script>

<template>
  <div v-if="messages.length" class="expandable-message-list">
    <slot name="heading" />
    <div class="expandable-message-list__items">
      <ExpandableMessageListItem
        v-for="(msg, idx) in messages"
        :key="idx"
        :message="msg"
        :expanded="expanded.has(idx)"
        :has-body="hasBody"
        :render-html="props.renderHtml"
        @toggle="toggle(idx)"
        @select="handleSelect(idx)"
      >
        <template v-if="hasBody" #body>
          <slot name="body" :message="msg" :index="idx" />
        </template>
        <template v-else #body>
          <div class="expandable-message-list__body">
            <!-- eslint-disable vue/no-v-html -- HTML is pre-sanitized by renderHtml, otherwise plain text is safe -->
            <div
              v-html="
                props.renderHtml ? props.renderHtml(msg.content) : msg.content
              "
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </template>
      </ExpandableMessageListItem>
    </div>
  </div>
</template>

<style scoped>
.expandable-message-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.expandable-message-list__items > * + * {
  margin-top: var(--spacing-0-5);
}
</style>
