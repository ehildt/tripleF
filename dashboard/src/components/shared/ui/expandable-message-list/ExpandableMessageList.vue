<script setup lang="ts">
import { computed, useSlots } from 'vue';

import type { ChatIconVisibility } from '@/types/app.model';

import ExpandableMessageListItem from './expandable-message-list-item/ExpandableMessageListItem.vue';
import type { MessageListItem as MessageListItemType } from './types';
import { useExpandableMessageList } from './use-expandable-message-list';

const props = withDefaults(
  defineProps<{
    items?: string | MessageListItemType[] | Record<string, unknown> | null;
    renderHtml?: (content: string) => string;
    onClick?: (index: number) => void;
    onCopy?: (index: number) => void;
    onToggleInclude?: (index: number) => void;
    onToggleMerge?: (index: number) => void;
    onDeleteItem?: (index: number) => void;
    onBranchOut?: (index: number) => void;
    expandAll?: boolean;
    showRole?: boolean;
    /** Id of the item to highlight as the currently-active one. */
    activeId?: string | null;
    /** Which action icons to show. Omitted keys default to visible. */
    iconVisibility?: Partial<ChatIconVisibility>;
    /** False when the conversation has fewer than two merge candidates —
     * the merge button grays out. */
    canMerge?: boolean;
    /** True when at least two user prompts are selected — merge icons pulse. */
    mergeArmed?: boolean;
  }>(),
  {
    items: null,
    renderHtml: undefined,
    onClick: undefined,
    onCopy: undefined,
    onToggleInclude: undefined,
    onToggleMerge: undefined,
    onDeleteItem: undefined,
    onBranchOut: undefined,
    showRole: true,
    activeId: null,
    iconVisibility: undefined,
    canMerge: false,
    mergeArmed: false,
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

function handleCopy(idx: number) {
  props.onCopy?.(idx);
}

function handleToggleInclude(idx: number) {
  props.onToggleInclude?.(idx);
}

function handleToggleMerge(idx: number) {
  props.onToggleMerge?.(idx);
}

function handleDeleteItem(idx: number) {
  props.onDeleteItem?.(idx);
}

function handleBranchOut(idx: number) {
  props.onBranchOut?.(idx);
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
        :show-branch="!!props.onBranchOut"
        :active="msg.id != null && msg.id === props.activeId"
        :icon-visibility="props.iconVisibility"
        :can-merge="props.canMerge"
        :merge-armed="props.mergeArmed"
        @toggle="toggle(idx)"
        @select="handleSelect(idx)"
        @copy="handleCopy(idx)"
        @toggle-include="handleToggleInclude(idx)"
        @toggle-merge="handleToggleMerge(idx)"
        @delete-item="handleDeleteItem(idx)"
        @branch-out="handleBranchOut(idx)"
      >
        <template v-if="hasBody" #body>
          <slot name="body" :message="msg" :index="idx" />
        </template>
        <template v-else #body>
          <div class="expandable-message-list__body">
            <!-- eslint-disable vue/no-v-html -- HTML is pre-sanitized by the consumer-supplied renderHtml -->
            <div
              v-if="props.renderHtml"
              v-html="props.renderHtml(msg.content)"
            />
            <!-- eslint-enable vue/no-v-html -->
            <!-- Plain messages render as interpolated text — raw content must
                 never reach v-html (it parses markup from untrusted input). -->
            <div v-else class="expandable-message-list__text">
              {{ msg.content }}
            </div>
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

/* Plain-text fallback: preserve line breaks the raw v-html path collapsed. */
.expandable-message-list__text {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* Inline code (backticks) and fenced command blocks inside markdown-rendered
   items: monospace from the global code rule, chip background to stand out. */
.expandable-message-list__body :deep(code) {
  font-size: 0.9em;
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
  background-color: color-mix(in srgb, var(--color-fg-primary) 8%, transparent);
}

.expandable-message-list__body :deep(pre) {
  overflow-x: auto;
  padding: var(--spacing-2);
  background-color: color-mix(in srgb, var(--color-fg-primary) 6%, transparent);
  border-radius: 0.25rem;
}

.expandable-message-list__body :deep(pre code) {
  padding: 0;
  background: none;
}
</style>
