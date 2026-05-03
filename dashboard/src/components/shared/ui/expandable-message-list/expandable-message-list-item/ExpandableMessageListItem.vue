<script setup lang="ts">
import ExpandableMessageListToggle from '../expandable-message-list-toggle/ExpandableMessageListToggle.vue';
import type { MessageListItem } from '../types';

defineProps<{
  message: MessageListItem;
  expanded: boolean;
  hasBody: boolean;
  renderHtml?: (content: string) => string;
}>();

defineEmits<{
  toggle: [];
  select: [];
}>();
</script>

<template>
  <div class="expandable-message-list__item">
    <ExpandableMessageListToggle
      :expanded="expanded"
      :role="message.role"
      :content="message.content"
      :has-body="hasBody"
      :render-html="renderHtml"
      @toggle="$emit('toggle')"
      @select="$emit('select')"
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
  background-color: color-mix(in srgb, var(--color-tab-debug) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-tab-debug) 20%, transparent);
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
