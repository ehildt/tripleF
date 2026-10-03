<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import { computed } from 'vue';

import { stripHtml } from '@/utils/strip-html.helper';

import MotionIcon from '../../motion-icon/MotionIcon.vue';

const props = withDefaults(
  defineProps<{
    expanded: boolean;
    role: string;
    content: string;
    hasBody: boolean;
    renderHtml?: (content: string) => string;
  }>(),
  {
    renderHtml: undefined,
  },
);

/** Plain-text preview of the content (HTML stripped) for the static preview. */
const previewText = computed(() =>
  stripHtml(props.renderHtml ? props.renderHtml(props.content) : props.content),
);

defineEmits<{
  toggle: [];
  select: [];
}>();
</script>

<template>
  <div class="expandable-message-list__toggle" @click="$emit('select')">
    <span
      v-if="hasBody"
      class="expandable-message-list__toggle-chevron"
      data-testid="expandable-message-list-toggle"
      @click.stop="$emit('toggle')"
    >
      <MotionIcon>
        <ChevronDown
          :class="{
            'expandable-message-list__toggle-chevron-icon--expanded': expanded,
          }"
          class="expandable-message-list__toggle-chevron-icon"
        />
      </MotionIcon>
    </span>
    <span class="expandable-message-list__toggle-role">{{ role }}</span>
    <span class="expandable-message-list__toggle-preview">
      {{ previewText }}
    </span>
  </div>
</template>

<style scoped>
.expandable-message-list__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2);
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.expandable-message-list__toggle:hover {
  background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent);
}

.expandable-message-list__toggle:active {
  background-color: color-mix(in srgb, var(--color-tab-debug) 20%, transparent);
  transition: none;
}

.expandable-message-list__toggle-chevron {
  flex-shrink: 0;
  cursor: pointer;
  padding: var(--spacing-0-5);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.expandable-message-list__toggle-chevron:hover
  .expandable-message-list__toggle-chevron-icon {
  color: var(--color-tab-debug);
}

.expandable-message-list__toggle-chevron-icon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--color-tab-debug) 70%, transparent);
  transition: transform 200ms ease;
}

.expandable-message-list__toggle-chevron-icon--expanded {
  transform: rotate(180deg);
}

.expandable-message-list__toggle-role {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.expandable-message-list__toggle-preview {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
