<script setup lang="ts">
import { computed, useSlots } from 'vue';

import ExpandableMessageListItem from './expandable-message-list-item/ExpandableMessageListItem.vue';
import type { MessageListItem as MessageListItemType } from './types';
import { useExpandableMessageList } from './use-expandable-message-list';

const props = withDefaults(
  defineProps<{
    items?: string | MessageListItemType[] | Record<string, unknown> | null;
    renderHtml?: (content: string) => string;
    onClick?: (index: number) => void;
    onToggleInclude?: (index: number) => void;
    onDeleteItem?: (index: number) => void;
    expandAll?: boolean;
    showRole?: boolean;
  }>(),
  {
    items: null,
    renderHtml: undefined,
    onClick: undefined,
    onToggleInclude: undefined,
    onDeleteItem: undefined,
    showRole: true,
  },
);

const slots = useSlots();
const hasBody = !!slots.body;

const { messages, expanded, toggle } = useExpandableMessageList(
  computed(() => props.items),
  props.expandAll,
);

function handleSelect(idx: number) {
  props.onClick?.(idx);
}

function handleToggleInclude(idx: number) {
  props.onToggleInclude?.(idx);
}

function handleDeleteItem(idx: number) {
  props.onDeleteItem?.(idx);
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
        :show-role="showRole"
        @toggle="toggle(idx)"
        @select="handleSelect(idx)"
        @toggle-include="handleToggleInclude(idx)"
        @delete-item="handleDeleteItem(idx)"
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
