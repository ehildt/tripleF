<script setup lang="ts">
import type { ChatIconVisibility } from '@/types/app.model';

import ExpandableMessageListToggle from '../expandable-message-list-toggle/ExpandableMessageListToggle.vue';
import type { MessageListItem } from '../types';

defineProps<{
  message: MessageListItem;
  expanded: boolean;
  hasBody: boolean;
  renderHtml?: (content: string) => string;
  showRole?: boolean;
  showBranch?: boolean;
  active?: boolean;
  iconVisibility?: Partial<ChatIconVisibility>;
  canMerge?: boolean;
  mergeArmed?: boolean;
}>();

defineEmits<{
  toggle: [];
  select: [];
  copy: [];
  toggleInclude: [];
  toggleMerge: [];
  deleteItem: [];
  branchOut: [];
}>();
</script>

<template>
  <div
    class="expandable-message-list__item"
    :class="{
      'expandable-message-list__item--excluded': message.included === false,
      'expandable-message-list__item--merged': message.merged,
      'expandable-message-list__item--active': active,
    }"
  >
    <ExpandableMessageListToggle
      :expanded="expanded"
      :role="message.role"
      :content="message.content"
      :has-body="hasBody"
      :render-html="renderHtml"
      :included="message.included"
      :context-percent="message.contextPercent"
      :show-role="showRole"
      :show-branch="showBranch"
      :icon-visibility="iconVisibility"
      :active="active"
      :merge-selected="message.mergeSelected"
      :merged-request-id="message.mergedRequestId"
      :can-merge="canMerge"
      :merge-armed="mergeArmed"
      @toggle="$emit('toggle')"
      @select="$emit('select')"
      @copy="$emit('copy')"
      @toggle-include="$emit('toggleInclude')"
      @toggle-merge="$emit('toggleMerge')"
      @delete-item="$emit('deleteItem')"
      @branch-out="$emit('branchOut')"
    />
    <Transition name="expand">
      <div v-if="hasBody && expanded" key="body" @click="$emit('select')">
        <slot name="body" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expandable-message-list__item {
  margin: 0.25rem 0;
  background-color: color-mix(in srgb, var(--color-tab-debug) 5%, transparent);
  transition: opacity 0.2s ease;
}

.expandable-message-list__item--excluded {
  opacity: 0.45;
}

/* Consumed by a completed merge: purple border marks the consolidated
   section while the item stays readable in the history list. */
.expandable-message-list__item--merged {
  background-color: color-mix(
    in srgb,
    var(--color-merge-merged) 8%,
    transparent
  );
}

.expandable-message-list__item--active {
  border-color: color-mix(
    in srgb,
    var(--color-accent-primary) 60%,
    transparent
  );
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

.expand-enter-active,
.expand-leave-active {
  transition:
    max-height 200ms ease,
    opacity 200ms ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
}
</style>
